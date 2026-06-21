import { CreditNoteRepository } from "@sincpro/mobile-distribution/adapters/repositories/credit_note.repository";
import { CustomerRepository } from "@sincpro/mobile-distribution/adapters/repositories/customer.repository";
import { InvoiceRepository } from "@sincpro/mobile-distribution/adapters/repositories/invoice.repository";
import { PaymentRepository } from "@sincpro/mobile-distribution/adapters/repositories/payment.repository";
import { PaymentCreditRepository } from "@sincpro/mobile-distribution/adapters/repositories/payment_credit.repository";
import { PaymentOdooRepository } from "@sincpro/mobile-distribution/adapters/repositories/payment_odoo.repository";
import { PriceListRepository } from "@sincpro/mobile-distribution/adapters/repositories/price_list.repository";
import { ProductRepository } from "@sincpro/mobile-distribution/adapters/repositories/product.repository";
import { RouteRepository } from "@sincpro/mobile-distribution/adapters/repositories/route.repository";
import { RouteOrderRepository } from "@sincpro/mobile-distribution/adapters/repositories/route_order.repository";
import { SaleOrderRepository } from "@sincpro/mobile-distribution/adapters/repositories/sale_order.repository";
import { EDistributionRepository } from "@sincpro/mobile-distribution/domain/repository";

const DistributionRepositoryRegistry = {
  [EDistributionRepository.CUSTOMER]: CustomerRepository,
  [EDistributionRepository.ROUTE]: RouteRepository,
  [EDistributionRepository.ROUTE_ORDER]: RouteOrderRepository,
  [EDistributionRepository.PRICE_LIST]: PriceListRepository,
  [EDistributionRepository.PRODUCT]: ProductRepository,
  [EDistributionRepository.SALE_ORDER]: SaleOrderRepository,
  [EDistributionRepository.INVOICE]: InvoiceRepository,
  [EDistributionRepository.CREDIT_NOTE]: CreditNoteRepository,
  [EDistributionRepository.PAYMENT]: PaymentRepository,
  [EDistributionRepository.PAYMENT_CREDIT]: PaymentCreditRepository,
  [EDistributionRepository.PAYMENT_ODOO]: PaymentOdooRepository,
};

export type DistributionRepositoryTypeMap = {
  [EDistributionRepository.CUSTOMER]: typeof CustomerRepository;
  [EDistributionRepository.ROUTE]: typeof RouteRepository;
  [EDistributionRepository.ROUTE_ORDER]: typeof RouteOrderRepository;
  [EDistributionRepository.PRICE_LIST]: typeof PriceListRepository;
  [EDistributionRepository.PRODUCT]: typeof ProductRepository;
  [EDistributionRepository.SALE_ORDER]: typeof SaleOrderRepository;
  [EDistributionRepository.INVOICE]: typeof InvoiceRepository;
  [EDistributionRepository.CREDIT_NOTE]: typeof CreditNoteRepository;
  [EDistributionRepository.PAYMENT]: typeof PaymentRepository;
  [EDistributionRepository.PAYMENT_CREDIT]: typeof PaymentCreditRepository;
  [EDistributionRepository.PAYMENT_ODOO]: typeof PaymentOdooRepository;
};

export { EDistributionRepository };
export default DistributionRepositoryRegistry;
