export type CaptchaWidgetProps = {
  siteKey: string;
  /** 確認が通った（トークンは5分で切れて、1回しか使えない） */
  onToken: (token: string) => void;
  /** うまく確認できなかった（code は Turnstile のエラーコードなど） */
  onError: (code: string) => void;
  /** 自動では通らず、チェックボックスを押してもらう必要がある */
  onInteractive: () => void;
};

// Turnstile のチェックボックスの大きさ（normal サイズ）
export const WIDGET_WIDTH = 300;
export const WIDGET_HEIGHT = 70;
