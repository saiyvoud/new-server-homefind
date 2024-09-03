import client from "../Database/radis.js";

export const DeleteCachedKey = async (key) => {
  const keys = await client.keys(key + "*");
  console.log("keys :>> ", keys);
  if (keys.length > 0) {
    const result = await client.del(keys);
    console.log(`${result} keys deleted successfully`);
  } else {
    console.log(`No keys starting with key ${key}`);
  }
};
