import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

/**
 * Notice that the exercise set is demo content
 * for a university project, not vetted training guidance.
 */
export function DemoDisclaimer() {
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>Demonstratives Datenset</AlertTitle>
      <AlertDescription>
        Dies ist eine Reihe von Beispielen, die zur Veranschaulichung des
        Projekts zufällig ausgewählt wurden. Es handelt sich hierbei nicht um
        ein medizinisches Trainingsprogramm.
      </AlertDescription>
    </Alert>
  );
}
