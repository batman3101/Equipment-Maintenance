declare module 'file-saver' {
  interface SaveAsOptions {
    autoBom?: boolean
  }

  export function saveAs(
    data: Blob | File | string,
    filename?: string,
    options?: SaveAsOptions
  ): void
}


