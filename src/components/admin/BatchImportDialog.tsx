import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Check, X, AlertTriangle, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { Collaborator } from "@/types";

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (collaborators: Omit<Collaborator, 'id' | 'createdAt'>[]) => Promise<void>;
}

interface ParsedCollaborator {
  name: string;
  department: string;
  type: 'funcionario' | 'terceirizado';
  company?: string;
  errors: string[];
  valid: boolean;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function BatchImportDialog({ open, onOpenChange, onImport }: BatchImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedCollaborator[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateTemplate = () => {
    const template = [
      ['Nome', 'Departamento', 'Tipo', 'Empresa'],
      ['João Silva', 'TI', 'funcionario', ''],
      ['Maria Santos', 'RH', 'terceirizado', 'Empresa ABC'],
      ['Pedro Costa', 'Operações', 'funcionario', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    
    // Style the header row
    if (!ws['!ref']) return;
    
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E3F2FD" } }
      };
    }
    
    XLSX.writeFile(wb, 'template_colaboradores.xlsx');
    
    toast({
      title: "Template baixado",
      description: "O arquivo template foi baixado com sucesso!"
    });
  };

  const validateCollaborator = (row: any): ParsedCollaborator => {
    const errors: string[] = [];
    const name = String(row.Nome || '').trim();
    const department = String(row.Departamento || '').trim();
    const type = String(row.Tipo || '').toLowerCase().trim();
    const company = String(row.Empresa || '').trim();

    if (!name) errors.push('Nome é obrigatório');
    if (!department) errors.push('Departamento é obrigatório');
    if (!type || !['funcionario', 'terceirizado'].includes(type)) {
      errors.push('Tipo deve ser "funcionario" ou "terceirizado"');
    }
    if (type === 'terceirizado' && !company) {
      errors.push('Empresa é obrigatória para terceirizados');
    }

    return {
      name,
      department,
      type: type as 'funcionario' | 'terceirizado',
      company: company || undefined,
      errors,
      valid: errors.length === 0
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo .xlsx",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast({
            title: "Arquivo vazio",
            description: "O arquivo não contém dados para importar",
            variant: "destructive"
          });
          return;
        }

        const parsed = jsonData.map(validateCollaborator);
        setParsedData(parsed);
        setStep('preview');
      } catch (error) {
        toast({
          title: "Erro ao processar arquivo",
          description: "Não foi possível ler o arquivo Excel",
          variant: "destructive"
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    const validData = parsedData.filter(item => item.valid);
    
    if (validData.length === 0) {
      toast({
        title: "Nenhum registro válido",
        description: "Corrija os erros antes de importar",
        variant: "destructive"
      });
      return;
    }

    setStep('importing');
    setProgress(0);

    try {
      const collaborators = validData.map(item => ({
        name: item.name,
        department: item.department,
        type: item.type,
        company: item.company
      }));

      await onImport(collaborators);
      
      setImportResults({ 
        success: validData.length, 
        errors: parsedData.length - validData.length 
      });
      setProgress(100);
      setStep('complete');
      
      toast({
        title: "Importação concluída",
        description: `${validData.length} colaboradores importados com sucesso!`
      });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação",
        variant: "destructive"
      });
      setStep('preview');
    }
  };

  const resetDialog = () => {
    setStep('upload');
    setParsedData([]);
    setProgress(0);
    setImportResults({ success: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const validCount = parsedData.filter(item => item.valid).length;
  const errorCount = parsedData.length - validCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Colaboradores em Lote</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload de um arquivo Excel com os dados dos colaboradores'}
            {step === 'preview' && 'Revise os dados antes de importar'}
            {step === 'importing' && 'Importando colaboradores...'}
            {step === 'complete' && 'Importação concluída'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Button variant="outline" onClick={generateTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Template Excel
                </Button>
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Clique para selecionar arquivo</p>
                    <p className="text-sm text-muted-foreground">
                      Ou arraste e solte um arquivo .xlsx aqui
                    </p>
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Formato esperado:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Nome:</strong> Nome completo (obrigatório)</li>
                  <li>• <strong>Departamento:</strong> Área de trabalho (obrigatório)</li>
                  <li>• <strong>Tipo:</strong> "funcionario" ou "terceirizado" (obrigatório)</li>
                  <li>• <strong>Empresa:</strong> Nome da empresa (obrigatório para terceirizados)</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {validCount} válidos
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errorCount} com erro
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Erros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.valid ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.department}</TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'funcionario' ? 'default' : 'secondary'}>
                            {item.type === 'funcionario' ? 'Funcionário' : 'Terceirizado'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.company || '-'}</TableCell>
                        <TableCell>
                          {item.errors.length > 0 && (
                            <div className="space-y-1">
                              {item.errors.map((error, i) => (
                                <div key={i} className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {error}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <div className="text-lg font-medium">Importando colaboradores...</div>
                <Progress value={progress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {progress}% concluído
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <Check className="mx-auto h-12 w-12 text-green-600" />
                <div className="text-lg font-medium">Importação Concluída!</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-600">Importados</div>
                </div>
                {importResults.errors > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResults.errors}</div>
                    <div className="text-sm text-red-600">Erros</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validCount === 0}
              >
                Importar {validCount} colaboradores
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}