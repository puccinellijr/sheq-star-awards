import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useCertificateGenerator() {
  const { toast } = useToast();

  const generateCertificate = async (
    collaboratorId: string, 
    type: 'funcionario' | 'terceirizado',
    month: string
  ) => {
    try {
      // Get collaborator details from database
      const { data: collaborator, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('id', collaboratorId)
        .single();

      if (error || !collaborator) {
        throw new Error('Colaborador não encontrado');
      }

      // Create a canvas to generate the certificate
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions
      canvas.width = 800;
      canvas.height = 600;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#1e40af'; // Odfjell blue
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Inner border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Title
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICADO DE DESTAQUE SHEQ', canvas.width / 2, 120);

      // Odfjell Terminals
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('ODFJELL TERMINALS', canvas.width / 2, 160);

      // Main text
      ctx.font = '18px Arial';
      ctx.fillStyle = '#374151';
      const typeText = type === 'funcionario' ? 'FUNCIONÁRIO' : 'TERCEIRIZADO';
      ctx.fillText(`Reconhecemos como destaque SHEQ do mês o ${typeText}:`, canvas.width / 2, 220);

      // Collaborator name
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#1e40af';
      ctx.fillText(collaborator.name.toUpperCase(), canvas.width / 2, 280);

      // Department and company info
      ctx.font = '18px Arial';
      ctx.fillStyle = '#6b7280';
      const departmentText = collaborator.company 
        ? `${collaborator.department} - ${collaborator.company}`
        : collaborator.department;
      ctx.fillText(departmentText, canvas.width / 2, 310);

      // Month
      const [year, monthNum] = month.split('-');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthName = monthNames[parseInt(monthNum) - 1];
      
      ctx.font = '20px Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText(`Referente ao mês de ${monthName} de ${year}`, canvas.width / 2, 350);

      // Recognition text
      ctx.font = '16px Arial';
      ctx.fillText('Pelo comprometimento e excelência em', canvas.width / 2, 400);
      ctx.fillText('Segurança, Saúde, Meio Ambiente e Qualidade', canvas.width / 2, 425);

      // Date and signature area
      const currentDate = new Date().toLocaleDateString('pt-BR');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`São Paulo, ${currentDate}`, canvas.width / 2, 500);

      // Signature line
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(300, 540);
      ctx.lineTo(500, 540);
      ctx.stroke();

      ctx.fillText('Direção Odfjell Terminals', canvas.width / 2, 560);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `certificado-sheq-${collaborator.name.replace(/\s+/g, '-')}-${month}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Certificado gerado!",
            description: "O certificado foi baixado com sucesso.",
          });
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Erro ao gerar certificado",
        description: "Não foi possível gerar o certificado.",
        variant: "destructive",
      });
    }
  };

  return {
    generateCertificate
  };
}