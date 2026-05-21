export const CONTEXT_MENU = {
    name: 'CONTEXT_MENU_NAME',
    options: [],
    render: false,
    target: null,
    select: (option) => {
        CONTEXT_MENU.render = false;
        option.callback();
    },
    close: () => {
        console.log(`CLOSE CONTEXT MENU`, CONTEXT_MENU);
        if (CONTEXT_MENU.target.closeOnContextMenu) CONTEXT_MENU.target.closeOnContextMenu.open = false;
        CONTEXT_MENU.render = false;
    },
    range: 100,
};