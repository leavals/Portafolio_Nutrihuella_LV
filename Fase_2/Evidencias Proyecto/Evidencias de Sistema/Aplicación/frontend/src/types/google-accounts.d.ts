// frontend/src/types/google-accounts.d.ts
// Tipos mínimos para Google Identity Services (One Tap / Sign In)

// Evita colisiones si ya existen tipos
export {};

declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google {
    namespace accounts {
      namespace id {
        type PromptMomentDismissedReason =
          | 'credential_returned'
          | 'cancel_called'
          | 'flow_restarted'
          | 'issuing_failed'
          | 'user_cancelled'
          | 'tap_outside'
          | 'secure_context_required'
          | 'unknown_reason';

        interface CredentialResponse {
          credential: string;         // ID token (JWT)
          select_by?: string;
          clientId?: string;
        }

        interface PromptMomentNotification {
          isDisplayed(): boolean;
          isNotDisplayed(): boolean;
          getDismissedReason(): PromptMomentDismissedReason | null;
          getMomentType(): string;
        }

        interface InitializeOptions {
          client_id: string;
          callback: (res: CredentialResponse) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          use_fedcm_for_prompt?: boolean;
        }

        interface RenderButtonOptions {
          type?: 'standard' | 'icon';
          theme?: 'outline' | 'filled_blue' | 'filled_black';
          size?: 'large' | 'medium' | 'small';
          text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
          shape?: 'rectangular' | 'pill' | 'circle' | 'square';
          logo_alignment?: 'left' | 'center';
          width?: string;
          locale?: string;
        }

        function initialize(options: InitializeOptions): void;
        function prompt(
          momentListener?: (n: PromptMomentNotification) => void
        ): void;
        function renderButton(
          parent: HTMLElement,
          options?: RenderButtonOptions,
          clickListener?: () => void
        ): void;
      }
    }
  }
}
