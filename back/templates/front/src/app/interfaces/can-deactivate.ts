export interface ICanDeactivate {
  canDeactivate: () => Promise<boolean> | boolean;
}
