const DB_NAME = "resumind";
const DB_VERSION = 4;
const STORE_NAME = "resumes";
const APPLICATION_STORE_NAME = "applications";

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }

      if (
        !database.objectStoreNames.contains(
          APPLICATION_STORE_NAME,
        )
      ) {
        database.createObjectStore(APPLICATION_STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      reject(
        new Error(
          "IndexedDB upgrade is blocked. Close other Resumind tabs and try again.",
        ),
      );
    };
  });
};

export const saveResume = async (resume: Resume): Promise<void> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(resume);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const getResume = async (id: string): Promise<Resume | undefined> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      database.close();
      resolve(request.result as Resume | undefined);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

export const getAllResumes = async (): Promise<Resume[]> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      database.close();
      resolve(request.result as Resume[]);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

export const deleteResume = async (id: string): Promise<void> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const saveApplication = async (
  application: JobApplication,
): Promise<void> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      APPLICATION_STORE_NAME,
      "readwrite",
    );
    const store = transaction.objectStore(APPLICATION_STORE_NAME);

    store.put(application);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const getApplication = async (
  id: string,
): Promise<JobApplication | undefined> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      APPLICATION_STORE_NAME,
      "readonly",
    );
    const store = transaction.objectStore(APPLICATION_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      database.close();
      resolve(request.result as JobApplication | undefined);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

export const getAllApplications = async (): Promise<
  JobApplication[]
> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      APPLICATION_STORE_NAME,
      "readonly",
    );
    const store = transaction.objectStore(APPLICATION_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      database.close();
      resolve(request.result as JobApplication[]);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

export const updateApplication = async (
  application: JobApplication,
): Promise<void> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      APPLICATION_STORE_NAME,
      "readwrite",
    );
    const store = transaction.objectStore(APPLICATION_STORE_NAME);

    store.put(application);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const deleteApplication = async (
  id: string,
): Promise<void> => {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      APPLICATION_STORE_NAME,
      "readwrite",
    );
    const store = transaction.objectStore(APPLICATION_STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};