let counter = 0

// Generates a unique DOM id, used to associate labels and messages with form controls.
export const uid = (prefix = 'ds') => `${prefix}-${++counter}`
