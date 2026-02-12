export type Option<T> = {
  id: string;
  name: string;
  value: T;
  color?: string | null;
  iconUrl?: string;
};

export type FieldError = {
  validator: string;
  message: string;
};
