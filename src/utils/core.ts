export const Core = {
  BlobRegistry: {
    urls: [] as string[],
    create(blob: Blob) {
      const url = URL.createObjectURL(blob);
      this.urls.push(url);
      return url;
    },
    revokeAll() {
      this.urls.forEach((url) => URL.revokeObjectURL(url));
      this.urls = [];
    },
  },
  AppState: {
    save(key: string, value: string) {
      localStorage.setItem('cts_' + key, value);
    },
    load(key: string) {
      return localStorage.getItem('cts_' + key);
    },
  },
  Utils: {
    sanitize(s: string) {
      return (s || '').replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
    },
  },
};
