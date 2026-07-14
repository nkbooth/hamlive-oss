/* hamlive-oss — MIT License. See LICENSE. */

import { EndPointClient, initAndLogError } from '#@client/lib/clientUtils.js';
import { NetListReactiveStore, FavoritesReactiveStore } from '#@client/lib/stores.js';
import { serverInfo } from '#@client/lib/serverInfo.js';
import { NetCards, NetUpNext, FavoriteInsert } from '#@client/lib/widgets.js';

// Assign endpoints to stores:
const netListEp = new EndPointClient('/api/data/livenets');
const netListStore = new NetListReactiveStore(netListEp);

// Initialize Dynamic Widgets
void initAndLogError(() => NetCards.init(netListStore));
void initAndLogError(() => NetUpNext.init(netListStore));

// Follow stars only exist for signed-in users; the follow endpoint requires auth.
if (serverInfo.isLoggedIn) {
    const favoritesEp = new EndPointClient('/api/data/follow');
    const favoritesStore = new FavoritesReactiveStore(favoritesEp, false);
    void initAndLogError(() => FavoriteInsert.init(favoritesStore));
    void initAndLogError(() => favoritesStore.init());
}

// Initialize netListStore
void initAndLogError(() => netListStore.init());
