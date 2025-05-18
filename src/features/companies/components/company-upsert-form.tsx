// /features/companies/components/company-upsert-form.tsx
"use client"

import { Form } from "@/components/form/form"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { upsertCompany } from "../actions/upsert-company"
import { useActionState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/form/field-error"
import { SaveIcon } from "lucide-react"
import { CompanyWithRelations } from "../types"
import { companiesPath } from "@/app/paths"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getCompanySegments } from "../queries/get-company-segments"
import { Combobox } from "@/components/combobox"

// Função para adicionar máscara ao CNPJ enquanto digita
const formatCNPJInput = (value: string) => {
  const cnpjDigits = value.replace(/\D/g, "");

  if (cnpjDigits.length <= 2) {
    return cnpjDigits;
  } else if (cnpjDigits.length <= 5) {
    return `${cnpjDigits.substring(0, 2)}.${cnpjDigits.substring(2)}`;
  } else if (cnpjDigits.length <= 8) {
    return `${cnpjDigits.substring(0, 2)}.${cnpjDigits.substring(2, 5)}.${cnpjDigits.substring(5)}`;
  } else if (cnpjDigits.length <= 12) {
    return `${cnpjDigits.substring(0, 2)}.${cnpjDigits.substring(2, 5)}.${cnpjDigits.substring(5, 8)}/${cnpjDigits.substring(8)}`;
  } else {
    return `${cnpjDigits.substring(0, 2)}.${cnpjDigits.substring(2, 5)}.${cnpjDigits.substring(5, 8)}/${cnpjDigits.substring(8, 12)}-${cnpjDigits.substring(12, 14)}`;
  }
};

type CompanyUpsertFormProps = {
  company?: CompanyWithRelations;
}

export function CompanyUpsertForm({ company }: CompanyUpsertFormProps) {
  const router = useRouter();
  const [segments, setSegments] = useState<string[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);

  // Estado para gerenciar o novo segmento a ser adicionado
  const [newSegment, setNewSegment] = useState("");
  const [selectedSegment, setSelectedSegment] = useState(company?.segment || "");

  // Controle dos valores do formulário
  const [formValues, setFormValues] = useState({
    name: company?.name || "",
    cnpj: company?.cnpj ? formatCNPJInput(company.cnpj) : "",
    active: company?.active !== undefined ? company.active : true,
  });

  const [state, action] = useActionState(
    upsertCompany.bind(null, company?.id),
    EMPTY_ACTION_STATE
  );

  // Carregar segmentos existentes
  useEffect(() => {
    const loadSegments = async () => {
      setIsLoadingSegments(true);
      try {
        const segmentList = await getCompanySegments();
        setSegments(segmentList);
      } catch (error) {
        console.error("Erro ao carregar segmentos:", error);
      } finally {
        setIsLoadingSegments(false);
      }
    };

    loadSegments();
  }, []);

  // Atualizar valores do formulário quando a empresa muda
  useEffect(() => {
    if (company) {
      setFormValues({
        name: company.name || "",
        cnpj: company.cnpj ? formatCNPJInput(company.cnpj) : "",
        active: company.active !== undefined ? company.active : true,
      });
      setSelectedSegment(company.segment || "");
    }
  }, [company]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    // Formatar CNPJ enquanto digita
    if (name === "cnpj") {
      setFormValues(prev => ({
        ...prev,
        [name]: formatCNPJInput(value)
      }));
      return;
    }

    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = (checked: boolean) => {
    setFormValues(prev => ({
      ...prev,
      active: checked
    }));
  };

  const handleSuccess = () => {
    router.push(companiesPath());
  };

  return (
    <Card className="p-6">
      <Form action={action} actionState={state} onSuccess={handleSuccess}>
        <div className="space-y-4">
          {/* Nome da Empresa */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              placeholder="Nome da empresa"
              required
            />
            <FieldError actionState={state} name="name" />
          </div>

          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={formValues.cnpj}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
              required
              maxLength={18}
            />
            <FieldError actionState={state} name="cnpj" />
          </div>

          {/* Segmento */}
          <div className="space-y-2">
            <Label htmlFor="segment">Segmento</Label>
            <Combobox
              id="segment"
              name="segment"
              value={selectedSegment}
              onChange={setSelectedSegment}
              options={segments.map(seg => ({ label: seg, value: seg }))}
              placeholder="Selecione ou digite um segmento"
              emptyMessage="Nenhum segmento encontrado"
              createOption={{
                enabled: true,
                label: "Criar novo segmento",
                onCreate: (value: string) => {
                  const newValue = value.trim();
                  if (newValue && !segments.includes(newValue)) {
                    setSegments(prev => [...prev, newValue]);
                    setSelectedSegment(newValue);
                  }
                  return newValue;
                }
              }}
            />
            <FieldError actionState={state} name="segment" />
          </div>

          {/* Status (Ativo/Inativo) */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Empresa Associada</Label>
            <Switch
              id="active"
              name="active"
              checked={formValues.active}
              onCheckedChange={handleToggleActive}
            />
            <input
              type="hidden"
              name="active"
              value={formValues.active ? "true" : "false"}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end pt-6">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => router.push(companiesPath())}
            type="button"
          >
            Cancelar
          </Button>
          <SubmitButton
            variant="default"
            icon={<SaveIcon className="mr-2 h-4 w-4" />}
            label={company ? "Atualizar Empresa" : "Criar Empresa"}
          />
        </div>
      </Form>
    </Card>
  )
}