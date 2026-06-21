import { Entity } from "@sincpro/mobile/domain/entity";

export interface IAuthorizedPerson {
  id: number;
  partnerId: number;
  name: string;
}

export interface IPaidInvoice {
  id: number;
  date: string;
}

export interface IRemoteCreditDTO {
  id: number;
  name: string;
  partner_id: {
    id: number;
    name: string;
    vat: string;
  };
  payment_amount: number;
  invoice_credit_sum: number;
  invoice_ids: {
    id: number;
    invoice_date: string;
    amount_total: number;
    amount_residual: number;
  }[];
  credit_authorized_ids?: {
    id: number;
    partner_id: {
      id: number;
      name: string;
    };
  }[];
}

export class Credit extends Entity {
  public id: number = 0;
  public name: string = "";
  public partnerId: number = 0;
  public partnerName: string = "";
  public creditLimit: number = 0;
  public availableCredit: number = 0;
  public paidInvoices: IPaidInvoice[] = [];
  public authorizedPersons: IAuthorizedPerson[] = [];

  static fromRemoteDTO(record: IRemoteCreditDTO): Credit {
    const data: Partial<Credit> = {
      id: record.id,
      name: record.name,
      partnerId: record.partner_id.id,
      partnerName: record.partner_id.name,
      availableCredit: record.invoice_credit_sum,
      creditLimit: record.payment_amount,
      paidInvoices: record.invoice_ids.map((inv) => ({
        id: inv.id,
        date: inv.invoice_date,
      })),
      authorizedPersons:
        record.credit_authorized_ids?.map((auth) => ({
          id: auth.id,
          partnerId: auth.partner_id.id,
          name: auth.partner_id.name,
        })) || [],
    };

    return Credit.obj(data);
  }

  get usedCredit(): number {
    return this.creditLimit - this.availableCredit;
  }

  get hasAvailableCredit(): boolean {
    return this.availableCredit > 0;
  }
}
