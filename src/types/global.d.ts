// Google Analytics 타입 정의
interface Window {
  gtag?: (
    command: string,
    action: string,
    params?: {
      [key: string]: any;
    }
  ) => void;
  dataLayer?: any[];
}