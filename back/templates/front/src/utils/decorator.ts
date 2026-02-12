export function WithLoading(loadingPropertyName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: { [key: string]: any }, ...args: any[]) {
      const loadingStore = this[loadingPropertyName];
      if (loadingStore?.set) {
        loadingStore.set(true);
      }

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        throw error;
      } finally {
        if (loadingStore?.set) {
          loadingStore.set(false);
        }
      }
    };

    return descriptor;
  };
}
