/**
 * Form Draft Persistence Engine
 * Saves form input state in real-time to localStorage so user data is NEVER lost
 * when switching tabs, minimizing the mobile app, or refreshing.
 */

export class FormDraftManager {
  /**
   * Saves draft data to localStorage
   */
  public static saveDraft<T extends Record<string, any>>(formKey: string, data: T): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(`mh_draft_${formKey}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`[DraftManager] Failed to save draft for ${formKey}:`, e);
    }
  }

  /**
   * Loads draft data from localStorage, falling back to default values
   */
  public static loadDraft<T extends Record<string, any>>(formKey: string, defaults: T): T {
    if (typeof window === 'undefined' || !window.localStorage) return defaults;
    try {
      const raw = window.localStorage.getItem(`mh_draft_${formKey}`);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    } catch (e) {
      console.warn(`[DraftManager] Failed to load draft for ${formKey}:`, e);
      return defaults;
    }
  }

  /**
   * Clears the draft from localStorage after successful submission or explicit cancel
   */
  public static clearDraft(formKey: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(`mh_draft_${formKey}`);
    } catch (e) {
      console.warn(`[DraftManager] Failed to clear draft for ${formKey}:`, e);
    }
  }
}
