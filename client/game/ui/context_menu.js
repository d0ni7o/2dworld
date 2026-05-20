export const CONTEXT_MENU = {
    name: 'CONTEXT_MENU_NAME',
    options: [],
    render: false,
    target: null,
    select: (option) => {
        CONTEXT_MENU.render = false;
        option.callback();
    },
    range: 100,
};