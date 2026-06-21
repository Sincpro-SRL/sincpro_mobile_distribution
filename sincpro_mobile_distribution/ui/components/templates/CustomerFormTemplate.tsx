import { LegalEntityTypes } from "@sincpro/mobile-distribution/domain/customer";
import {
  CustomerCreateForm,
  CustomerFormValues,
} from "@sincpro/mobile-distribution/ui/components/organisms";
import { FormViewV2 } from "@sincpro/mobile-ui/views/FormViewV2";
import { Children, isValidElement, ReactElement, ReactNode } from "react";
import { Control, FieldErrors } from "react-hook-form";

interface CustomerFormTemplateProps {
  control: Control<CustomerFormValues>;
  errors: FieldErrors<CustomerFormValues>;
  legalEntityType: LegalEntityTypes;
  isSubmitting: boolean;
  title: string;
  description?: string;
  onBack: () => void;
  children?: ReactNode;
}

interface SlotProps {
  children: ReactNode;
}

function Footer({ children }: SlotProps) {
  return <>{children}</>;
}

function CustomerFormTemplateRoot({
  control,
  errors,
  legalEntityType,
  isSubmitting,
  title,
  description = "Registro de datos del cliente",
  onBack,
  children,
}: CustomerFormTemplateProps) {
  let footerSlot: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const element = child as ReactElement<SlotProps>;
    if (child.type === Footer) {
      footerSlot = element.props.children;
    }
  });

  return (
    <FormViewV2.Root
      description={description}
      isLoading={isSubmitting}
      item={{}}
      name={title}
      onBack={onBack}
    >
      <FormViewV2.Header />

      <FormViewV2.Content>
        <FormViewV2.Content.Groups>
          <FormViewV2.Content.Group>
            <CustomerCreateForm
              control={control}
              errors={errors}
              legalEntityType={legalEntityType}
            />
          </FormViewV2.Content.Group>
        </FormViewV2.Content.Groups>
      </FormViewV2.Content>

      {footerSlot && <FormViewV2.Footer>{footerSlot}</FormViewV2.Footer>}
    </FormViewV2.Root>
  );
}

export const CustomerFormTemplate = Object.assign(CustomerFormTemplateRoot, {
  Footer,
});
