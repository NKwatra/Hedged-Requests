export async function fetchWithHedging(config: {
  primaryUrl: string;
  secondaryUrl: string;
  hedgeThreshold: number;
}) {
  const signalP = new AbortController();
  const signalS = new AbortController();
  let timer: NodeJS.Timeout;
  const primaryPromise = fetch(config.primaryUrl, {
    signal: signalP.signal,
  })
    .then((r) => {
      if (!r.ok) {
        throw new Error(`primary call failed with status code: ${r.status} `);
      }
      if (timer) {
        clearTimeout(timer);
      }
      return r.json();
    })
    .catch((err) => {
      console.log("primary call failed", err);
      throw err;
    });

  const secondaryPromise = new Promise<any>((resolve, reject) => {
    timer = setTimeout(() => {
      const r = fetch(config.secondaryUrl, {
        signal: signalS.signal,
      });
      r.then(resolve).catch(reject);
    }, config.hedgeThreshold);
  })
    .then((r) => {
      if (!r.ok) {
        throw new Error(`secondary call failed with status code: ${r.status} `);
      }
      return r.json();
    })
    .catch((err) => {
      console.log("secondary call failed", err);
      throw err;
    });

  try {
    const r = await Promise.any([primaryPromise, secondaryPromise]);
    signalP.abort();
    signalS.abort();
    return r;
  } catch (e) {
    return null;
  }
}

export async function fetchStandard(url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) {
      throw new Error(`standard call failed with status code: ${r.status} `);
    }
    const json = await r.json();
    return json;
  } catch (err) {
    console.log("standard call failed", err);
    return null;
  }
}

export async function fetchTied(config: {
  primaryUrl: string;
  secondaryUrl: string;
}) {
  const controller = new AbortController();
  const primaryPromise = fetch(config.primaryUrl, {
    signal: controller.signal,
  })
    .then((r) => {
      if (!r.ok) {
        throw new Error(`primary call failed with status code: ${r.status} `);
      }
      return r.json();
    })
    .catch((err) => {
      console.log("primary call failed", err);
      throw err;
    });

  const secondaryPromise = fetch(config.secondaryUrl, {
    signal: controller.signal,
  })
    .then((r) => {
      if (!r.ok) {
        throw new Error(`secondary call failed with status code: ${r.status} `);
      }
      return r.json();
    })
    .catch((err) => {
      console.log("secondary call failed", err);
      throw err;
    });

  try {
    const r = await Promise.any([primaryPromise, secondaryPromise]);
    controller.abort();
    return r;
  } catch (e) {
    return null;
  }
}
