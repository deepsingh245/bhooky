import { onCall } from "firebase-functions/v2/https";
import { normalizeAddress } from "../addresses/normalizeAddress.js";
import { getSwiggyMcpClient } from "../swiggy/mcpClient.js";
import { getValidSwiggySession } from "../swiggy/session.js";
import { requireUid, withSwiggyReconnect } from "./handlerUtils.js";

export const getAddressesHandler = onCall(async (request) => {
  const uid = requireUid(request);

  return withSwiggyReconnect(async () => {
    const { token } = await getValidSwiggySession(uid);
    const client = getSwiggyMcpClient(token);
    const response = await client.getAddresses();
    return { addresses: response.addresses.map(normalizeAddress) };
  });
});
