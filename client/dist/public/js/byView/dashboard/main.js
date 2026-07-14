import { EndPointClient, initAndLogError } from '#@client/lib/clientUtils.js';
import { NetListReactiveStore, FavoritesReactiveStore } from '#@client/lib/stores.js';
import { serverInfo } from '#@client/lib/serverInfo.js';
import { NetCards, NetUpNext, FavoriteInsert } from '#@client/lib/widgets.js';
const netListEp = new EndPointClient('/api/data/livenets');
const netListStore = new NetListReactiveStore(netListEp);
void initAndLogError(() => NetCards.init(netListStore));
void initAndLogError(() => NetUpNext.init(netListStore));
if (serverInfo.isLoggedIn) {
    const favoritesEp = new EndPointClient('/api/data/follow');
    const favoritesStore = new FavoritesReactiveStore(favoritesEp, false);
    void initAndLogError(() => FavoriteInsert.init(favoritesStore));
    void initAndLogError(() => favoritesStore.init());
}
void initAndLogError(() => netListStore.init());
//# sourceMappingURL=main.js.map