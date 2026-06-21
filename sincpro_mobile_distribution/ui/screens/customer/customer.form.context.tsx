import { DomainNetworkError } from "@sincpro/mobile/exceptions";
import {
  Customer,
  ECustomerRouteStatus,
  IdentificationType,
  LegalEntityTypes,
} from "@sincpro/mobile-distribution/domain/customer";
import { AppScreen } from "@sincpro/mobile-distribution/entrypoints/ui/AppScreen";
import { customerService } from "@sincpro/mobile-distribution/services/customer.service";
import { useConfirmationContext } from "@sincpro/mobile-ui/Dialog/Confirmation.context";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Control, FieldErrors, useForm } from "react-hook-form";
import { useNavigate } from "react-router-native";

export interface CustomerFormValues {
  vat: string;
  identificationType: IdentificationType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone: string;
  email: string;
  address?: string;
  economicActivityCode?: string;
}

interface ICustomerFormContext {
  isSubmitting: boolean;
  error: string | null;
  legalEntityType: LegalEntityTypes;
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
  submit: () => void;
  reset: () => void;
}

const CustomerFormContext = createContext<ICustomerFormContext | null>(null);

export function CustomerFormProvider({
  children,
  initialCustomer,
  onCreate,
}: {
  children: React.ReactNode;
  initialCustomer?: Customer;
  onCreate?: (customer: Customer) => void;
}) {
  const navigate = useNavigate();
  const { show, hide } = useConfirmationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalEntityType, setLegalEntityType] = useState<LegalEntityTypes>(
    initialCustomer?.legalEntityType || LegalEntityTypes.INDIVIDUAL,
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    mode: "onBlur",
    defaultValues: {
      vat: initialCustomer?.vat || "",
      identificationType: initialCustomer?.identificationType || IdentificationType.FISICA,
      firstName: "",
      lastName: "",
      companyName: initialCustomer?.name || "",
      phone: initialCustomer?.phone || "",
      email: initialCustomer?.email || "",
      address: initialCustomer?.address || "",
      economicActivityCode: initialCustomer?.economicActivityCode || "",
    },
  });

  const identificationType = watch("identificationType");

  useEffect(() => {
    const newLegalEntityType =
      identificationType === IdentificationType.JURIDICA
        ? LegalEntityTypes.COMPANY
        : LegalEntityTypes.INDIVIDUAL;
    setLegalEntityType(newLegalEntityType);
  }, [identificationType]);

  const createCustomer = useCallback(
    async (data: CustomerFormValues) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const customerName =
          legalEntityType === LegalEntityTypes.INDIVIDUAL
            ? `${data.firstName} ${data.lastName}`.trim()
            : data.companyName || "";

        const customerData: Partial<Customer> = {
          name: customerName,
          vat: data.vat,
          ref: "",
          identificationType: data.identificationType,
          legalEntityType,
          email: data.email,
          phone: data.phone,
          address: data.address,
          economicActivityCode: data.economicActivityCode,
          routeStatus: ECustomerRouteStatus.CREATED_IN_ROUTE,
        };

        const customer = Customer.obj(customerData);
        const created = await customerService.createCustomer(
          customer,
          ECustomerRouteStatus.CREATED_IN_ROUTE,
        );

        if (onCreate) {
          onCreate(created);
        } else {
          navigate(AppScreen.CUSTOMER_LIST);
        }

        setIsSubmitting(false);
      } catch (e) {
        const isNetworkError = e instanceof DomainNetworkError;
        const errorMessage = (e as Error).message;

        setError(errorMessage);
        setIsSubmitting(false);

        if (isNetworkError) {
          show({
            title: "⚠️ Sin conexión",
            message: `No se pudo sincronizar con el servidor.\n\n${errorMessage}\n\n¿Desea continuar en modo offline?`,
            confirmText: "Continuar Offline",
            cancelText: "Cancelar",
            onConfirm: () => {
              hide();
              const customerForCallback = Customer.obj<Customer>({
                name:
                  legalEntityType === LegalEntityTypes.INDIVIDUAL
                    ? `${data.firstName} ${data.lastName}`.trim()
                    : data.companyName || "",
                vat: data.vat,
                identificationType: data.identificationType,
                legalEntityType,
                email: data.email,
                phone: data.phone,
                address: data.address,
                routeStatus: ECustomerRouteStatus.CREATED_IN_ROUTE,
              });
              if (onCreate) {
                onCreate(customerForCallback);
              } else {
                navigate(AppScreen.CUSTOMER_LIST);
              }
            },
            onCancel: () => hide(),
          });
        } else {
          show({
            title: "❌ Error",
            message: `${errorMessage}\n\n¿Desea continuar de todas formas?`,
            confirmText: "Continuar",
            cancelText: "Cancelar",
            onConfirm: () => {
              hide();
              if (onCreate) {
                const customerForCallback = Customer.obj<Customer>({
                  name:
                    legalEntityType === LegalEntityTypes.INDIVIDUAL
                      ? `${data.firstName} ${data.lastName}`.trim()
                      : data.companyName || "",
                  vat: data.vat,
                  identificationType: data.identificationType,
                  legalEntityType,
                  email: data.email,
                  phone: data.phone,
                  address: data.address,
                  routeStatus: ECustomerRouteStatus.CREATED_IN_ROUTE,
                });
                onCreate(customerForCallback);
              } else {
                navigate(AppScreen.CUSTOMER_LIST);
              }
            },
            onCancel: () => hide(),
          });
        }
      }
    },
    [legalEntityType, onCreate, navigate, show, hide],
  );

  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setLegalEntityType(LegalEntityTypes.INDIVIDUAL);
  }, []);

  const submit = useCallback(() => {
    handleSubmit(createCustomer)();
  }, [handleSubmit, createCustomer]);

  const value = useMemo<ICustomerFormContext>(
    () => ({
      isSubmitting,
      error,
      legalEntityType,
      control,
      errors,
      submit,
      reset: resetForm,
    }),
    [isSubmitting, error, legalEntityType, control, errors, submit, resetForm],
  );

  return (
    <CustomerFormContext.Provider value={value}>{children}</CustomerFormContext.Provider>
  );
}

export function useCustomerForm() {
  const ctx = useContext(CustomerFormContext);
  if (!ctx) throw new Error("useCustomerForm must be used within CustomerFormProvider");
  return ctx;
}
