export const ITEM_INVENTORY = {
    name: 'ITEM_INVENTORY',
    target: null,
    render: false,
    open: function (target) {
        ITEM_INVENTORY.target = target;
        ITEM_INVENTORY.render = true;
    },
    close: function () {
        ITEM_INVENTORY.render = false;
        ITEM_INVENTORY.target = null;
    },
    range: 100,
};