export enum OperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export const handleFirestoreError = (error: any, operation: OperationType, path: string) => {
  console.error(`Error during ${operation} at ${path}:`, error);
};
