import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useCollaborators } from "@/hooks/useCollaborators";
import { BatchImportDialog } from "@/components/admin/BatchImportDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, UserCheck, Building2, Upload } from "lucide-react";
import { Collaborator } from "@/types";

export default function AdminCollaborators() {
  const { collaborators, isLoading, addCollaborator, addMultipleCollaborators, updateCollaborator, deleteCollaborator } = useCollaborators();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "funcionario" | "terceirizado">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    type: "funcionario" as "funcionario" | "terceirizado",
    company: ""
  });

  const filteredCollaborators = collaborators.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      department: "",
      type: "funcionario",
      company: ""
    });
    setEditingCollaborator(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.department) {
      toast({
        title: "Erro",
        description: "Nome e departamento são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (editingCollaborator) {
      updateCollaborator(editingCollaborator.id, formData);
      toast({
        title: "Sucesso",
        description: "Colaborador atualizado com sucesso!"
      });
    } else {
      addCollaborator(formData);
      toast({
        title: "Sucesso",
        description: "Colaborador adicionado com sucesso!"
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setFormData({
      name: collaborator.name,
      department: collaborator.department,
      type: collaborator.type,
      company: collaborator.company || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (collaborator: Collaborator) => {
    if (confirm(`Tem certeza que deseja excluir ${collaborator.name}?`)) {
      deleteCollaborator(collaborator.id);
      toast({
        title: "Sucesso",
        description: "Colaborador removido com sucesso!"
      });
    }
  };

  const handleBatchImport = async (collaborators: Omit<Collaborator, 'id' | 'createdAt'>[]) => {
    await addMultipleCollaborators(collaborators);
    setIsBatchImportOpen(false);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Colaboradores">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gerenciar Colaboradores">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Colaboradores</h2>
            <p className="text-muted-foreground">
              Gerencie funcionários e terceirizados elegíveis para votação
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBatchImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Lote
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Colaborador
                </Button>
              </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCollaborator ? "Editar Colaborador" : "Novo Colaborador"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do colaborador
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Departamento ou área"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: "funcionario" | "terceirizado") => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="terceirizado">Terceirizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.type === "terceirizado" && (
                    <div className="grid gap-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Nome da empresa terceirizada"
                      />
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCollaborator ? "Atualizar" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Batch Import Dialog */}
        <BatchImportDialog
          open={isBatchImportOpen}
          onOpenChange={setIsBatchImportOpen}
          onImport={handleBatchImport}
        />

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="funcionario">Funcionários</SelectItem>
              <SelectItem value="terceirizado">Terceirizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collaborators.length}</div>
              <p className="text-xs text-muted-foreground">colaboradores</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {collaborators.filter(c => c.type === 'funcionario').length}
              </div>
              <p className="text-xs text-muted-foreground">internos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terceirizados</CardTitle>
              <Building2 className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                {collaborators.filter(c => c.type === 'terceirizado').length}
              </div>
              <p className="text-xs text-muted-foreground">externos</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Colaboradores</CardTitle>
            <CardDescription>
              {filteredCollaborators.length} de {collaborators.length} colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCollaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{collaborator.name}</h3>
                      <Badge variant={collaborator.type === 'funcionario' ? 'default' : 'secondary'}>
                        {collaborator.type === 'funcionario' ? 'Funcionário' : 'Terceirizado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{collaborator.department}</span>
                      {collaborator.company && (
                        <span>• {collaborator.company}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(collaborator)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(collaborator)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredCollaborators.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}