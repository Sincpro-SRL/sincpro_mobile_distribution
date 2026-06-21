import { loggerAdapter } from "@sincpro/mobile/infrastructure/logger";
import { toMap } from "@sincpro/mobile/tools/utils/collections";
import { CreditNote, CreditNoteLine } from "@sincpro/mobile-distribution/domain/credit_note";
import { getOdooClient } from "@sincpro/mobile-odoo/infrastructure/OdooClient";

export interface IStockPicking {
  id: number;
  name: string;
  state: string;
  origin: string;
  date: string;
  dateDone?: string;
  partnerId: number;
  partnerName: string;
  externalUuid?: string;
  routeId?: number;
  moves: IStockMove[];
}

export interface IStockMove {
  id: number;
  name: string;
  productId: number;
  productName: string;
  productCode?: string;
  quantityDemand: number;
  quantityDone: number;
  uomId: number;
  uomName: string;
}

interface IRemoteStockPickingDTO {
  id: number;
  name: string;
  state: string;
  origin: string;
  date: string;
  date_done?: string;
  created_in_route_plan_id?: number;
  external_uuid?: string;
  partner_id: {
    id: number;
    name: string;
  };
  move_ids: {
    id: number;
    name: string;
    product_id: {
      id: number;
      name: string;
      default_code?: string;
    };
    product_uom_qty: number;
    quantity: number;
    product_uom: {
      id: number;
      name: string;
    };
  }[];
}

interface IWizardReturnMove {
  id: number;
  product_id: number;
  quantity: number;
  move_id: number;
}

interface IWizardReturnForm {
  id: number;
  product_return_moves: IWizardReturnMove[];
}

const STOCK_PICKING_SPEC_QUERY = {
  id: {},
  name: {},
  state: {},
  origin: {},
  date: {},
  date_done: {},
  created_in_route_plan_id: {},
  external_uuid: {},
  partner_id: {
    fields: {
      id: {},
      name: {},
    },
  },
  move_ids: {
    fields: {
      id: {},
      name: {},
      product_id: {
        fields: {
          id: {},
          name: {},
          default_code: {},
        },
      },
      product_uom_qty: {},
      quantity: {},
      product_uom: {
        fields: {
          id: {},
          name: {},
        },
      },
    },
  },
};

function mapRemoteToStockPicking(remote: IRemoteStockPickingDTO): IStockPicking {
  return {
    id: remote.id,
    name: remote.name,
    state: remote.state,
    origin: remote.origin,
    date: remote.date,
    dateDone: remote.date_done,
    partnerId: remote.partner_id?.id || 0,
    partnerName: remote.partner_id?.name || "",
    externalUuid: remote.external_uuid,
    routeId: remote.created_in_route_plan_id,
    moves: (remote.move_ids || []).map((move) => ({
      id: move.id,
      name: move.name,
      productId: move.product_id?.id || 0,
      productName: move.product_id?.name || "",
      productCode: move.product_id?.default_code,
      quantityDemand: move.product_uom_qty || 0,
      quantityDone: move.quantity || 0,
      uomId: move.product_uom?.id || 0,
      uomName: move.product_uom?.name || "",
    })),
  };
}

class StockPickingOdooAdapterImpl {
  async fetchPickingById(pickingId: number): Promise<IStockPicking | null> {
    if (!pickingId || pickingId <= 0) {
      throw new Error("Invalid picking ID provided");
    }

    loggerAdapter.info(`Fetching stock picking ${pickingId}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteStockPickingDTO>(
      "stock.picking",
      [["id", "=", pickingId]],
      STOCK_PICKING_SPEC_QUERY,
    );

    if (!result.records || result.records.length === 0) {
      loggerAdapter.warn(`Stock picking ${pickingId} not found`);
      return null;
    }

    return mapRemoteToStockPicking(result.records[0]);
  }

  async fetchPickingsBySaleOrderId(saleOrderId: number): Promise<IStockPicking[]> {
    if (!saleOrderId || saleOrderId <= 0) {
      throw new Error("Invalid sale order ID provided");
    }

    loggerAdapter.info(`Fetching pickings for sale order ${saleOrderId}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteStockPickingDTO>(
      "stock.picking",
      [
        ["sale_id", "=", saleOrderId],
        ["return_id", "=", false],
        ["state", "=", "done"],
      ],
      STOCK_PICKING_SPEC_QUERY,
    );

    if (!result.records || result.records.length === 0) {
      loggerAdapter.warn(`No pickings found for sale order ${saleOrderId}`);
      return [];
    }

    loggerAdapter.info(`Found ${result.records.length} pickings for sale order`);
    return result.records.map(mapRemoteToStockPicking);
  }

  async fetchReturnPickingsByRoute(routeId: number): Promise<IStockPicking[]> {
    if (!routeId || routeId <= 0) {
      throw new Error("Invalid route ID provided");
    }

    loggerAdapter.info(`Fetching return pickings for route ${routeId}`);
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IRemoteStockPickingDTO>(
      "stock.picking",
      [
        ["created_in_route_plan_id", "=", routeId],
        ["return_id", "!=", false],
      ],
      STOCK_PICKING_SPEC_QUERY,
    );

    if (!result.records || result.records.length === 0) {
      return [];
    }

    return result.records.map(mapRemoteToStockPicking);
  }

  async createPhysicalReturnFromCreditNote(
    creditNote: CreditNote,
    originalSaleOrderId: number,
  ): Promise<{ pickingId: number; pickingName: string }> {
    loggerAdapter.info(
      `Creating physical return for credit note ${creditNote.name} from sale order ${originalSaleOrderId}`,
    );
    const odooClient = getOdooClient();

    const saleOrderPickings = await this.fetchPickingsBySaleOrderId(originalSaleOrderId);
    if (saleOrderPickings.length === 0) {
      throw new Error(
        `No stock pickings found for sale order ${originalSaleOrderId}. Cannot create return.`,
      );
    }

    const originalPicking = saleOrderPickings[0];

    const returnWizardId = await odooClient.callModel<number>(
      "stock.return.picking",
      "create",
      [{}],
      {},
      {
        active_model: "stock.picking",
        active_id: originalPicking.id,
      },
    );

    if (!returnWizardId) {
      throw new Error("Failed to create return wizard instance");
    }

    const wizardDetails = await this.fetchWizardReturnPicking(returnWizardId);

    await this.updateWizardReturnLines(
      returnWizardId,
      wizardDetails,
      creditNote.creditNoteLines,
    );

    const createReturnAction = await odooClient.callModel<{ res_id: number }>(
      "stock.return.picking",
      "create_returns",
      [returnWizardId],
    );

    if (!createReturnAction?.res_id) {
      throw new Error("Failed to create return picking");
    }

    const returnPickingId = createReturnAction.res_id;

    await odooClient.callModel("stock.picking", "write", [
      returnPickingId,
      {
        external_uuid: creditNote.uuid,
        created_in_route_plan_id: creditNote.routeId || false,
        origin: `Credit Note: ${creditNote.name}`,
      },
    ]);

    const returnPicking = await this.fetchPickingById(returnPickingId);
    if (!returnPicking) {
      throw new Error(`Failed to fetch created return picking ${returnPickingId}`);
    }

    loggerAdapter.info(
      `Physical return created: ${returnPicking.name} (ID: ${returnPicking.id})`,
    );

    return {
      pickingId: returnPicking.id,
      pickingName: returnPicking.name,
    };
  }

  async hasPhysicalReturn(creditNoteUuid: string): Promise<boolean> {
    if (!creditNoteUuid) return false;

    try {
      const odooClient = getOdooClient();

      const result = await odooClient.queryModel<{ id: number }>(
        "stock.picking",
        [
          ["external_uuid", "=", creditNoteUuid],
          ["return_id", "!=", false],
        ],
        { id: {} },
      );

      return result.records && result.records.length > 0;
    } catch (error) {
      loggerAdapter.warn(`Error checking physical return for ${creditNoteUuid}: ${error}`);
      return false;
    }
  }

  async getPhysicalReturnStatus(
    creditNoteUuid: string,
  ): Promise<{ hasReturn: boolean; picking?: IStockPicking; status?: string }> {
    if (!creditNoteUuid) {
      return { hasReturn: false };
    }

    try {
      const odooClient = getOdooClient();

      const result = await odooClient.queryModel<IRemoteStockPickingDTO>(
        "stock.picking",
        [
          ["external_uuid", "=", creditNoteUuid],
          ["return_id", "!=", false],
        ],
        STOCK_PICKING_SPEC_QUERY,
      );

      if (!result.records || result.records.length === 0) {
        return { hasReturn: false };
      }

      const picking = mapRemoteToStockPicking(result.records[0]);
      return {
        hasReturn: true,
        picking,
        status: picking.state,
      };
    } catch (error) {
      loggerAdapter.warn(
        `Error getting physical return status for ${creditNoteUuid}: ${error}`,
      );
      return { hasReturn: false };
    }
  }

  private async fetchWizardReturnPicking(wizardId: number): Promise<IWizardReturnForm> {
    const odooClient = getOdooClient();

    const result = await odooClient.queryModel<IWizardReturnForm>(
      "stock.return.picking",
      [["id", "=", wizardId]],
      {
        id: {},
        product_return_moves: {
          fields: {
            id: {},
            product_id: {},
            quantity: {},
            move_id: {},
          },
        },
      },
    );

    if (!result.records || result.records.length === 0) {
      throw new Error(`Failed to fetch return wizard ${wizardId}`);
    }

    return result.records[0];
  }

  private async updateWizardReturnLines(
    wizardId: number,
    wizardDetails: IWizardReturnForm,
    creditNoteLines: CreditNoteLine[],
  ): Promise<void> {
    const odooClient = getOdooClient();

    const returnLinesMap = toMap(
      creditNoteLines,
      (line) => line.productId,
      (line) => line.quantity,
    );

    const commands: [number, number, { quantity?: number }?][] = [];

    for (const move of wizardDetails.product_return_moves) {
      const productId = move.product_id;
      const newQuantity = returnLinesMap.get(productId);

      if (newQuantity !== undefined) {
        commands.push([1, move.id, { quantity: newQuantity }]);
      } else {
        commands.push([2, move.id]);
      }
    }

    if (commands.length > 0) {
      await odooClient.callModel("stock.return.picking", "write", [
        wizardId,
        { product_return_moves: commands },
      ]);
    }
  }
}

export const StockPickingAdapter = new StockPickingOdooAdapterImpl();
