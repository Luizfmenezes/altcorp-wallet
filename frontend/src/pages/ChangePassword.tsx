import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ChangePassword: React.FC = () => {
  const { user, forgotPassword, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const profileEmail = user?.apiUser?.email || user?.profile?.email || '';

  const [passwordCode, setPasswordCode] = useState('');
  const [passwordNewValue, setPasswordNewValue] = useState('');
  const [passwordConfirmValue, setPasswordConfirmValue] = useState('');
  const [isSendingPasswordCode, setIsSendingPasswordCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordCooldown, setPasswordCooldown] = useState(0);

  useEffect(() => {
    if (passwordCooldown <= 0) return;
    const timer = globalThis.setTimeout(() => setPasswordCooldown((value) => value - 1), 1000);
    return () => globalThis.clearTimeout(timer);
  }, [passwordCooldown]);

  const handleSendPasswordCode = async () => {
    if (!profileEmail || passwordCooldown > 0) {
      return;
    }

    setIsSendingPasswordCode(true);
    try {
      const message = await forgotPassword(profileEmail);
      setPasswordCooldown(60);
      toast({
        title: 'Código enviado',
        description: message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o código.';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingPasswordCode(false);
    }
  };

  const handleChangePassword = async () => {
    if (!profileEmail) {
      toast({
        title: 'Erro',
        description: 'Sua conta precisa ter um email para alterar a senha.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordCode.trim().length !== 6) {
      toast({
        title: 'Erro',
        description: 'Informe o código de 6 dígitos enviado por email.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordNewValue.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordNewValue !== passwordConfirmValue) {
      toast({
        title: 'Erro',
        description: 'As senhas não conferem.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const message = await resetPassword(profileEmail, passwordCode.trim(), passwordNewValue, passwordConfirmValue);
      setPasswordCode('');
      setPasswordNewValue('');
      setPasswordConfirmValue('');
      toast({
        title: 'Senha alterada',
        description: message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível alterar a senha.';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed81a,transparent_35%),linear-gradient(180deg,#07111f_0%,#0b1220_14%,hsl(var(--background))_38%)] pb-24 lg:pb-8">
      <header className="px-4 pt-5 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto rounded-[28px] border border-white/10 bg-slate-950/80 text-white p-6 shadow-[0_20px_70px_rgba(2,8,23,0.45)] backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-cyan-300/80 hover:text-cyan-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Voltar para configurações
          </button>
          <h1 className="text-2xl lg:text-3xl font-semibold mt-3">Alteração de senha</h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xl">
            Para confirmar a troca, enviaremos um código para o email da sua conta.
          </p>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 mt-4 max-w-3xl mx-auto">
        <section className="rounded-[28px] border border-border/60 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Segurança da Conta</h2>
          </div>

          <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
            Esse processo funciona para conta local e para contas Google com email cadastrado.
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="security-email" className="text-sm text-muted-foreground mb-1 block">Email de confirmação</label>
              <Input
                id="security-email"
                type="email"
                value={profileEmail}
                readOnly
                disabled
                className="input-finance text-sm opacity-80 cursor-not-allowed"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleSendPasswordCode}
              disabled={!profileEmail || isSendingPasswordCode || passwordCooldown > 0}
              className="w-full h-11 rounded-2xl"
            >
              {isSendingPasswordCode ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              {passwordCooldown > 0 ? `Reenviar código em ${passwordCooldown}s` : 'Enviar código para alterar senha'}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="security-code" className="text-sm text-muted-foreground mb-1 block">Código recebido</label>
                <Input
                  id="security-code"
                  inputMode="numeric"
                  value={passwordCode}
                  onChange={(e) => setPasswordCode(e.target.value.replaceAll(/\D/g, '').slice(0, 6))}
                  className="input-finance"
                  placeholder="000000"
                />
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Clock3 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>O código enviado por email expira em 10 minutos.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="security-new-password" className="text-sm text-muted-foreground mb-1 block">Nova senha</label>
                <Input
                  id="security-new-password"
                  type="password"
                  value={passwordNewValue}
                  onChange={(e) => setPasswordNewValue(e.target.value)}
                  className="input-finance"
                  placeholder="Nova senha"
                />
              </div>
              <div>
                <label htmlFor="security-confirm-password" className="text-sm text-muted-foreground mb-1 block">Confirmar nova senha</label>
                <Input
                  id="security-confirm-password"
                  type="password"
                  value={passwordConfirmValue}
                  onChange={(e) => setPasswordConfirmValue(e.target.value)}
                  className="input-finance"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            <Button type="button" onClick={handleChangePassword} disabled={isUpdatingPassword || !profileEmail} className="w-full h-12 rounded-2xl text-sm font-semibold">
              {isUpdatingPassword ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Alterar senha com código
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChangePassword;