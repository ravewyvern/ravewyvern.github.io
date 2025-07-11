

let _printBuffer = '';

const browserExtensionMode = false;
const STORAGE_KEYS = {
    code: 'novaScriptCode',
    projectName: 'novaScriptProjectName',
    keymap: 'novaScriptKeymap'
};
const defaultKeymap = {
    'runCode': 'Ctrl-Enter',
    'clearOutput': 'Ctrl-K'
};

let currentFileHandle = null;
let isDirty = false;
let customThemes = [];
let keymap = { ...defaultKeymap };

const defaultThemes = [
    {name: 'Dark Night (Default)', isDefault: true, css: `:root { --accent-color: #6e57ff; --accent-color-hover: #4e3dcc; --button-text-color: #ffffff; --text-color: #e0e0ff; --secondary-text-color: #9f9fcf; --darker-text-color: #bcbce0; --danger-color: #ff4d6d; --danger-color-hover: #cc3a53; --discard-color: #666688; --discard-color-hover: #4d4d66; --background-color: #050505; --foreground-color: #0d0d0f; --panel-color: #111118; --menu-hover-color: #1a1a22; --menu-hover-color-light: #2a2a38; --panel-border-color: #222234; --code-block-color: #1a1a2a; --sidebar-color: #0a0a12; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; --token-keyword-color:#6e57ff;--token-function-color:#a47fff;--token-variable-color:#d6d6ff;--token-identifier-color:#bcbce0;--token-operator-color:#9f9fcf;--token-boolean-color:#ff4d6d;--token-builtin-color:#ffb86c;--token-comment-color:#557;--token-punctuation-color:#7c7cb8;--token-string-color:#ffb8e1;--highlight-active-line-bg:#6e57ff0a;--highlight-selection-bg:#3e3e57;--editor-cursor-color:#bd93f9;--highlight-bracket-bg:#6e57ff40;--highlight-selection-match-bg:#8888ff22;--autocomplete-selected-bg:#6e57ff;--autocomplete-selected-text:#fff;--autocomplete-bg:#2a2a38}`},
    { name: 'Nova Dark', isDefault: true, css: `:root { --token-keyword-color: #a377ff;--token-function-color: #c28fff;--token-variable-color: #e0d6ff;--token-identifier-color: #cccce0;--token-operator-color: #aaaacc;--token-boolean-color: #ff5a75;--token-builtin-color: #ffb86c;--token-comment-color: #666688;--token-punctuation-color: #9f9fcf;--token-string-color: #ffb8e1;--highlight-active-line-bg: #773ea510;--highlight-selection-bg: #3e3e57;--editor-cursor-color: #773ea5;--highlight-bracket-bg: #773ea540;--highlight-selection-match-bg: #8888ff22;--autocomplete-selected-bg: #773ea5;--autocomplete-selected-text: #ffffff;--autocomplete-bg: #2c2c38; --accent-color: #773ea5; --button-text-color: #ffffff; #773ea5; --accent-color-hover: #5d2d84; --text-color: #ffffff; --secondary-text-color: #888; --darker-text-color: #ccc; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #676767; --discard-color-hover: #555; --background-color: #1a1a1a; --foreground-color: #212121; --panel-color: #2c2c2c; --menu-hover-color: #3e3e3e; --menu-hover-color-light: #575757; --panel-border-color: #333; --code-block-color: #333; --sidebar-color: #252526; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Nova Light', isDefault: true, css: `:root { --token-keyword-color: #5e3e94;--token-function-color: #905ecb;--token-variable-color: #bfbfff;--token-identifier-color: #55557a;--token-operator-color: #7777aa;--token-boolean-color: #d22f4f;--token-builtin-color: #ff8b4c;--token-comment-color: #999999;--token-punctuation-color: #8888aa;--token-string-color: #eeaacc;--highlight-active-line-bg: #773ea510;--highlight-selection-bg: #c0c0e0;--editor-cursor-color: #773ea5;--highlight-bracket-bg: #773ea540;--highlight-selection-match-bg: #8888ff22;--autocomplete-selected-bg: #5d2d84;--autocomplete-selected-text: #ffffff;--autocomplete-bg: #eaeaff; --accent-color: #773ea5; --button-text-color: #ffffff; --accent-color-hover: #5d2d84; --text-color: #000000; --secondary-text-color: #555; --darker-text-color: #333; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #aaa; --discard-color-hover: #888; --background-color: #f4f4f4; --foreground-color: #ffffff; --panel-color: #eaeaea; --menu-hover-color: #dcdcdc; --menu-hover-color-light: #c0c0c0; --panel-border-color: #ccc; --code-block-color: #ddd; --sidebar-color: #f0f0f0; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Nova Black', isDefault: true, css: `:root { --token-keyword-color: #a377ff;--token-function-color: #c28fff;--token-variable-color: #d6d6ff;--token-identifier-color: #bcbce0;--token-operator-color: #9f9fcf;--token-boolean-color: #ff4d6d;--token-builtin-color: #ffb86c;--token-comment-color: #555577;--token-punctuation-color: #7c7cb8;--token-string-color: #ffb8e1;--highlight-active-line-bg: #773ea510;--highlight-selection-bg: #3e3e57;--editor-cursor-color: #773ea5;--highlight-bracket-bg: #773ea540;--highlight-selection-match-bg: #8888ff22;--autocomplete-selected-bg: #773ea5;--autocomplete-selected-text: #ffffff;--autocomplete-bg: #1c1c2a; --accent-color: #773ea5; --button-text-color: #ffffff; --accent-color-hover: #5d2d84; --text-color: #ffffff; --secondary-text-color: #999; --darker-text-color: #aaa; --danger-color: #dc3545; --danger-color-hover: #a53131; --discard-color: #888; --discard-color-hover: #666; --background-color: #000000; --foreground-color: #0a0a0a; --panel-color: #111111; --menu-hover-color: #1a1a1a; --menu-hover-color-light: #222222; --panel-border-color: #1c1c1c; --code-block-color: #1c1c1c; --sidebar-color: #0d0d0d; --panel-radius: 20px; --button-radius: 20px; --popup-radius: 20px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Terminal', isDefault: true, css: `:root { --token-keyword-color: #ffffff;--token-function-color: #bbbbbb;--token-variable-color: #aaaaaa;--token-identifier-color: #cccccc;--token-operator-color: #999999;--token-boolean-color: #ff4444;--token-builtin-color: #ffcc66;--token-comment-color: #777777;--token-punctuation-color: #999999;--token-string-color: #ffaaee;--highlight-active-line-bg: #ffffff11;--highlight-selection-bg: #333333;--editor-cursor-color: #ffffff;--highlight-bracket-bg: #ffffff22;--highlight-selection-match-bg: #ffffff22;--autocomplete-selected-bg: #ffffff;--autocomplete-selected-text: #000000;--autocomplete-bg: #1a1a1a; --accent-color: #ffffff; --button-text-color: #000000; --accent-color-hover: #cccccc; --text-color: #ffffff; --secondary-text-color: #ffffff; --darker-text-color: #ffffff; --danger-color: #ff5555; --danger-color-hover: #cc4444; --discard-color: #999999; --discard-color-hover: #777777; --background-color: #000000; --foreground-color: #000000; --panel-color: #000000; --menu-hover-color: #222222; --menu-hover-color-light: #333333; --panel-border-color: #444444; --code-block-color: #111111; --sidebar-color: #000000; --panel-radius: 0px; --button-radius: 0px; --popup-radius: 0px; --small-radius: 0px; --window-gap: 0px; --inner-gap: 0px; }`},
    {name: 'Sakura Light',isDefault: true,css: `:root { --token-keyword-color: #ff5ea8;--token-function-color: #ff94c9;--token-variable-color: #f4bce6;--token-identifier-color: #cfa0bf;--token-operator-color: #d69fd3;--token-boolean-color: #c2185b;--token-builtin-color: #ff8b94;--token-comment-color: #aa88aa;--token-punctuation-color: #d48dc7;--token-string-color: #ffcce8;--highlight-active-line-bg: #ff5ea810;--highlight-selection-bg: #f2d6e3;--editor-cursor-color: #ff80ab;--highlight-bracket-bg: #ff5ea840;--highlight-selection-match-bg: #8888ff22;--autocomplete-selected-bg: #ff80ab;--autocomplete-selected-text: #ffffff;--autocomplete-bg: #fbe9f2; --accent-color: #ff80ab;--accent-color-hover: #ff5c9b;--button-text-color: #ffffff;--text-color: #333333;--secondary-text-color: #666666;--darker-text-color: #999999;--danger-color: #e53935;--danger-color-hover: #b71c1c;--discard-color: #cccccc;--discard-color-hover: #bbbbbb;--background-color: #fff0f5;--foreground-color: #ffffff;--panel-color: #f9e6ef;--menu-hover-color: #f2d6e3;--menu-hover-color-light: #e6c4d4;--panel-border-color: #e0a9c1;--code-block-color: #fbe9f2;--sidebar-color: #ffe4ec;--panel-radius: 15px;--button-radius: 10px;--popup-radius: 12px;--small-radius: 5px;--window-gap: 10px;--inner-gap: 10px;}`},
    {name: 'Ocean Breeze',isDefault: true,css: `:root { --token-keyword-color: #00e5ff;--token-function-color: #80deea;--token-variable-color: #b2ebf2;--token-identifier-color: #b2dfdb;--token-operator-color: #80cbc4;--token-boolean-color: #ff5252;--token-builtin-color: #ffc107;--token-comment-color: #4dd0e1;--token-punctuation-color: #81d4fa;--token-string-color: #ffccbc;--highlight-active-line-bg: #00bcd410;--highlight-selection-bg: #006064;--editor-cursor-color: #00bcd4;--highlight-bracket-bg: #00bcd440;--highlight-selection-match-bg: #8888ff22;--autocomplete-selected-bg: #00bcd4;--autocomplete-selected-text: #ffffff;--autocomplete-bg: #003845; --accent-color: #00bcd4;--accent-color-hover: #0097a7;--button-text-color: #ffffff;--text-color: #e0f7fa;--secondary-text-color: #80deea;--darker-text-color: #4dd0e1;--danger-color: #ef5350;--danger-color-hover: #c62828;--discard-color: #0097a7;--discard-color-hover: #006064;--background-color: #002b36;--foreground-color: #003845;--panel-color: #004d5d;--menu-hover-color: #005f6b;--menu-hover-color-light: #007c91;--panel-border-color: #006064;--code-block-color: #01303a;--sidebar-color: #002c3a;--panel-radius: 10px;--button-radius: 10px;--popup-radius: 10px;--small-radius: 5px;--window-gap: 8px;--inner-gap: 8px;}`},
    {name: 'Mocha Code',isDefault: true,css: `:root { --token-keyword-color: #d6a561; --token-function-color: #eec292; --token-variable-color: #f8e2c5; --token-identifier-color: #dac5b4; --token-operator-color: #c8ab98; --token-boolean-color: #ff6b6b; --token-builtin-color: #f0a35e; --token-comment-color: #b49a8a; --token-punctuation-color: #cda176; --token-string-color: #ffd6c2; --highlight-active-line-bg: #d6a56110; --highlight-selection-bg: #543a32; --editor-cursor-color: #d6a561; --highlight-bracket-bg: #d6a56140; --highlight-selection-match-bg: #ffdab920; --autocomplete-selected-bg: #d6a561; --autocomplete-selected-text: #1c1c1c; --autocomplete-bg: #3a2924; --accent-color: #d6a561;--accent-color-hover: #b88a4c;--button-text-color: #1c1c1c;--text-color: #f0e0d6;--secondary-text-color: #c8b8ac;--darker-text-color: #a68e7e;--danger-color: #ff6b6b;--danger-color-hover: #cc5555;--discard-color: #997c6c;--discard-color-hover: #7a6152;--background-color: #2e1f1b;--foreground-color: #3a2924;--panel-color: #432f29;--menu-hover-color: #543a32;--menu-hover-color-light: #6a4d42;--panel-border-color: #5a4338;--code-block-color: #4a3a33;--sidebar-color: #3b2823;--panel-radius: 16px;--button-radius: 12px;--popup-radius: 12px;--small-radius: 6px;--window-gap: 10px;--inner-gap: 10px;}`},
    {name: 'Sunset Glow',isDefault: true,css: `:root { --token-keyword-color: #ff7043; --token-function-color: #ffab91; --token-variable-color: #ffd180; --token-identifier-color: #ffccbc; --token-operator-color: #ffab40; --token-boolean-color: #ff5252; --token-builtin-color: #ffb74d; --token-comment-color: #ffccbc; --token-punctuation-color: #ff8a65; --token-string-color: #ffe0b2; --highlight-active-line-bg: #ff704310; --highlight-selection-bg: #5d4037; --editor-cursor-color: #ff7043; --highlight-bracket-bg: #ff704340; --highlight-selection-match-bg: #fff3e020; --autocomplete-selected-bg: #ff7043; --autocomplete-selected-text: #ffffff; --autocomplete-bg: #4e342e; --accent-color: #ff7043;--accent-color-hover: #f4511e;--button-text-color: #ffffff;--text-color: #ffffff;--secondary-text-color: #ffd180;--darker-text-color: #ffab40;--danger-color: #ef5350;--danger-color-hover: #c62828;--discard-color: #ffccbc;--discard-color-hover: #ffab91;--background-color: #2d1e1b;--foreground-color: #3e2723;--panel-color: #4e342e;--menu-hover-color: #5d4037;--menu-hover-color-light: #6d4c41;--panel-border-color: #8d6e63;--code-block-color: #3e2c27;--sidebar-color: #38221e;--panel-radius: 20px;--button-radius: 16px;--popup-radius: 16px;--small-radius: 6px;--window-gap: 12px;--inner-gap: 12px;}`},
    {name: 'Forest Floor',isDefault: true,css: `:root { --token-keyword-color: #81c784; --token-function-color: #a5d6a7; --token-variable-color: #c8e6c9; --token-identifier-color: #e8f5e9; --token-operator-color: #aed581; --token-boolean-color: #ef5350; --token-builtin-color: #ffd54f; --token-comment-color: #9ccc65; --token-punctuation-color: #a5d6a7; --token-string-color: #ffe082; --highlight-active-line-bg: #81c78410; --highlight-selection-bg: #455a64; --editor-cursor-color: #81c784; --highlight-bracket-bg: #81c78440; --highlight-selection-match-bg: #c5e1a520; --autocomplete-selected-bg: #81c784; --autocomplete-selected-text: #1b1f1d; --autocomplete-bg: #263238; --accent-color: #81c784;--accent-color-hover: #66bb6a;--button-text-color: #1b1f1d;--text-color: #e8f5e9;--secondary-text-color: #a5d6a7;--darker-text-color: #c8e6c9;--danger-color: #e57373;--danger-color-hover: #d32f2f;--discard-color: #9e9e9e;--discard-color-hover: #757575;--background-color: #1b1f1d;--foreground-color: #263238;--panel-color: #37474f;--menu-hover-color: #455a64;--menu-hover-color-light: #546e7a;--panel-border-color: #4caf50;--code-block-color: #2e3c3a;--sidebar-color: #26332f;--panel-radius: 12px;--button-radius: 12px;--popup-radius: 12px;--small-radius: 6px;--window-gap: 10px;--inner-gap: 10px;}`},
    {name: 'Catppuccin Mocha', isDefault: true, css: `:root { --token-keyword-color: #89b4fa; --token-function-color: #b4d0fa; --token-variable-color: #cdd6f4; --token-identifier-color: #bac2de; --token-operator-color: #a6adc8; --token-boolean-color: #f38ba8; --token-builtin-color: #fab387; --token-comment-color: #585b70; --token-punctuation-color: #a6accd; --token-string-color: #f5c2e7; --highlight-active-line-bg: #89b4fa10; --highlight-selection-bg: #45475a; --editor-cursor-color: #89b4fa; --highlight-bracket-bg: #89b4fa40; --highlight-selection-match-bg: #8888ff22; --autocomplete-selected-bg: #89b4fa; --autocomplete-selected-text: #1e1e2e; --autocomplete-bg: #313244; --accent-color: #89b4fa; --accent-color-hover: #739df2; --button-text-color: #1e1e2e; --text-color: #cdd6f4; --secondary-text-color: #a6adc8; --darker-text-color: #9399b2; --danger-color: #f38ba8; --danger-color-hover: #d64c63; --discard-color: #7f849c; --discard-color-hover: #6c7086; --background-color: #1e1e2e; --foreground-color: #181825; --panel-color: #313244; --menu-hover-color: #45475a; --menu-hover-color-light: #585b70; --panel-border-color: #585b70; --code-block-color: #2c2f44; --sidebar-color: #1e1e2e; --panel-radius: 16px; --button-radius: 12px; --popup-radius: 12px; --small-radius: 6px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Gruvbox', isDefault: true, css: `:root { --token-keyword-color: #fabd2f; --token-function-color: #fe8019; --token-variable-color: #ebdbb2; --token-identifier-color: #d5c4a1; --token-operator-color: #bdae93; --token-boolean-color: #fb4934; --token-builtin-color: #d3869b; --token-comment-color: #928374; --token-punctuation-color: #d5c4a1; --token-string-color: #b8bb26; --highlight-active-line-bg: #fabd2f10; --highlight-selection-bg: #665c54; --editor-cursor-color: #fabd2f; --highlight-bracket-bg: #fabd2f40; --highlight-selection-match-bg: #ffdd8822; --autocomplete-selected-bg: #fabd2f; --autocomplete-selected-text: #282828; --autocomplete-bg: #504945; --accent-color: #fabd2f; --accent-color-hover: #d79921; --button-text-color: #282828; --text-color: #ebdbb2; --secondary-text-color: #d5c4a1; --darker-text-color: #bdae93; --danger-color: #fb4934; --danger-color-hover: #cc241d; --discard-color: #928374; --discard-color-hover: #7c6f64; --background-color: #282828; --foreground-color: #3c3836; --panel-color: #504945; --menu-hover-color: #665c54; --menu-hover-color-light: #7c6f64; --panel-border-color: #a89984; --code-block-color: #3c3836; --sidebar-color: #32302f; --panel-radius: 10px; --button-radius: 10px; --popup-radius: 10px; --small-radius: 4px; --window-gap: 8px; --inner-gap: 8px; }`},
    {name: 'Rosé Pine', isDefault: true, css: `:root { --token-keyword-color: #eb6f92; --token-function-color: #f093b3; --token-variable-color: #e0def4; --token-identifier-color: #908caa; --token-operator-color: #6e6a86; --token-boolean-color: #eb6f92; --token-builtin-color: #f6c177; --token-comment-color: #524f67; --token-punctuation-color: #9a89c1; --token-string-color: #e0aaff; --highlight-active-line-bg: #eb6f9210; --highlight-selection-bg: #2a273f; --editor-cursor-color: #eb6f92; --highlight-bracket-bg: #eb6f9240; --highlight-selection-match-bg: #9a89c122; --autocomplete-selected-bg: #eb6f92; --autocomplete-selected-text: #191724; --autocomplete-bg: #26233a; --accent-color: #eb6f92; --accent-color-hover: #d94f78; --button-text-color: #191724; --text-color: #e0def4; --secondary-text-color: #908caa; --darker-text-color: #6e6a86; --danger-color: #eb6f92; --danger-color-hover: #d94f78; --discard-color: #524f67; --discard-color-hover: #403d52; --background-color: #191724; --foreground-color: #1f1d2e; --panel-color: #26233a; --menu-hover-color: #2a273f; --menu-hover-color-light: #332e4a; --panel-border-color: #403d52; --code-block-color: #2a273f; --sidebar-color: #1f1d2e; --panel-radius: 14px; --button-radius: 10px; --popup-radius: 10px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Material', isDefault: true, css: `:root { --token-keyword-color: #82aaff; --token-function-color: #b2ccff; --token-variable-color: #eeffff; --token-identifier-color: #b0bec5; --token-operator-color: #90a4ae; --token-boolean-color: #f07178; --token-builtin-color: #c3e88d; --token-comment-color: #546e7a; --token-punctuation-color: #a0cfff; --token-string-color: #c3e88d; --highlight-active-line-bg: #82aaff10; --highlight-selection-bg: #455a64; --editor-cursor-color: #82aaff; --highlight-bracket-bg: #82aaff40; --highlight-selection-match-bg: #82aaff22; --autocomplete-selected-bg: #82aaff; --autocomplete-selected-text: #263238; --autocomplete-bg: #2e3c43; --accent-color: #82aaff; --accent-color-hover: #5c9eff; --button-text-color: #263238; --text-color: #eeffff; --secondary-text-color: #b0bec5; --darker-text-color: #90a4ae; --danger-color: #f07178; --danger-color-hover: #d44f5a; --discard-color: #546e7a; --discard-color-hover: #455a64; --background-color: #263238; --foreground-color: #2e3c43; --panel-color: #37474f; --menu-hover-color: #455a64; --menu-hover-color-light: #546e7a; --panel-border-color: #607d8b; --code-block-color: #2e3c43; --sidebar-color: #2e3c43; --panel-radius: 12px; --button-radius: 10px; --popup-radius: 10px; --small-radius: 5px; --window-gap: 10px; --inner-gap: 10px; }`},
    {name: 'Dracula', isDefault: true, css: `:root { --token-keyword-color: #bd93f9; --token-function-color: #d6afff; --token-variable-color: #f8f8f2; --token-identifier-color: #bfb8e0; --token-operator-color: #6272a4; --token-boolean-color: #ff5555; --token-builtin-color: #ffb86c; --token-comment-color: #6272a4; --token-punctuation-color: #caa9fa; --token-string-color: #ff79c6; --highlight-active-line-bg: #bd93f910; --highlight-selection-bg: #44475a; --editor-cursor-color: #bd93f9; --highlight-bracket-bg: #bd93f940; --highlight-selection-match-bg: #bd93f922; --autocomplete-selected-bg: #bd93f9; --autocomplete-selected-text: #282a36; --autocomplete-bg: #44475a; --accent-color: #bd93f9; --accent-color-hover: #a982e1; --button-text-color: #282a36; --text-color: #f8f8f2; --secondary-text-color: #bd93f9; --darker-text-color: #6272a4; --danger-color: #ff5555; --danger-color-hover: #cc4444; --discard-color: #6272a4; --discard-color-hover: #44475a; --background-color: #282a36; --foreground-color: #1e1f29; --panel-color: #44475a; --menu-hover-color: #55576d; --menu-hover-color-light: #6d6f8d; --panel-border-color: #6272a4; --code-block-color: #3d3f51; --sidebar-color: #343746; --panel-radius: 14px; --button-radius: 12px; --popup-radius: 12px; --small-radius: 6px; --window-gap: 10px; --inner-gap: 10px; }`}
];
const themeStyleTag = document.createElement('style');
themeStyleTag.id = 'dynamic-theme-style';
document.head.appendChild(themeStyleTag);

function applyTheme(themeName, css) {
    themeStyleTag.textContent = css || '';
    localStorage.setItem('novaScriptActiveTheme', themeName);
}
function saveCustomThemes() {
    localStorage.setItem('novaScriptCustomThemes', JSON.stringify(customThemes));
}
function loadCustomThemes() {
    const saved = localStorage.getItem('novaScriptCustomThemes');
    if (saved) {
        customThemes = JSON.parse(saved);
    }
}

document.addEventListener('DOMContentLoaded', async () => { // added async may need to remove idk
    const projectNameText = document.getElementById('project-name-text');
    const projectNameInput = document.getElementById('project-name-input');
    const runBtn = document.getElementById('run-btn');
    const settingsModal = document.getElementById('settings-modal');

    const defaultCode = ``;
    loadCustomThemes();

    const savedThemeName = localStorage.getItem('novaScriptActiveTheme');
    if (savedThemeName) {
        const allThemes = [...defaultThemes, ...customThemes];
        const themeToApply = allThemes.find(t => t.name === savedThemeName);
        if (themeToApply) {
            applyTheme(themeToApply.name, themeToApply.css);
        }
    }


    const savedCode = localStorage.getItem(STORAGE_KEYS.code);

    const savedProjectName = localStorage.getItem(STORAGE_KEYS.projectName);
    projectNameText.textContent = savedProjectName || 'Untitled Project';
    projectNameInput.value = savedProjectName || 'Untitled Project';
    isDirty = false;

    document.getElementById('settings-btn').addEventListener('click', () => {
        settingsModal.classList.add('show');
    });

    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) aboutModal.classList.remove('show');
        if (event.target === settingsModal) settingsModal.classList.remove('show'); // Add this line
    });


    const resizer = document.getElementById('resizer');
    const editorContainer = document.querySelector('.editor-container');

    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize'; // Change cursor for the whole page
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (!isResizing) return;
        const editorLeft = editorContainer.getBoundingClientRect().left;
        const newWidth = e.clientX - editorLeft;
        if (newWidth > 100) {
            editorContainer.style.width = `${newWidth}px`;
        }
    }

    function onMouseUp() {
        isResizing = false;
        document.body.style.cursor = 'default'; // Reset cursor
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    function setupDropdown(buttonId, dropdownId) {
        const button = document.getElementById(buttonId);
        const dropdown = document.getElementById(dropdownId);
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            document.querySelectorAll('.dropdown-content').forEach(d => {
                if (d.id !== dropdownId) d.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        });
    }

    setupDropdown('file-btn', 'file-dropdown');
    setupDropdown('edit-btn', 'edit-dropdown');
    setupDropdown('addon-btn', 'addon-dropdown');
    setupDropdown('help-btn', 'help-dropdown');
    setupDropdown('state-btn', 'state-dropdown');
    window.addEventListener('click', (event) => {
        if (!event.target.matches('.dropdown button')) {
            document.querySelectorAll('.dropdown-content').forEach(d => {
                d.classList.remove('show');
            });
        }
    });

    document.getElementById('project-menu').addEventListener('click', () => {
        projectNameText.style.display = 'none';
        projectNameInput.style.display = 'inline-block';
        projectNameInput.focus();
        projectNameInput.select();
    });

    function updateProjectName() {
        const newName = projectNameInput.value.trim();
        if (newName) {
            projectNameText.textContent = newName;
            localStorage.setItem(STORAGE_KEYS.projectName, newName);
        }
        projectNameInput.style.display = 'none';
        projectNameText.style.display = 'inline-block';
    }

    projectNameInput.addEventListener('blur', updateProjectName);
    projectNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') updateProjectName();
        if (e.key === 'Escape') {
            projectNameInput.value = projectNameText.textContent; // Revert changes
            updateProjectName();
        }
    });

    const iconSidebarButtons = {
        files: document.getElementById('sidebar-files-btn'),
        search: document.getElementById('sidebar-search-btn')
    };
    const collapsibleSidebar = document.getElementById('collapsible-sidebar');
    const iconSidebar = document.getElementById('icon-sidebar');
    const sidebarPanels = {
        files: document.getElementById('files-panel'),
        search: document.getElementById('search-panel')
    };

    let activePanel = null;

    const toggleSidebarPanel = (panelName) => {
        if (activePanel === panelName) {
            collapsibleSidebar.style.display = 'none';
            iconSidebar.classList.remove('sidebar-panel-active');
            activePanel = null;
        } else {
            collapsibleSidebar.style.display = 'block';
            iconSidebar.classList.add('sidebar-panel-active');
            activePanel = panelName;
            Object.values(sidebarPanels).forEach(panel => panel.classList.remove('show'));
            sidebarPanels[panelName].classList.add('show');
        }

        Object.keys(iconSidebarButtons).forEach(key => {
            iconSidebarButtons[key].classList.toggle('active', key === activePanel);
        });
    };

    iconSidebarButtons.files.addEventListener('click', () => toggleSidebarPanel('files'));
    iconSidebarButtons.search.addEventListener('click', () => toggleSidebarPanel('search'));

    const aboutModal = document.getElementById('about-modal');
    document.getElementById('about-btn').addEventListener('click', (e) => {
        e.preventDefault();
        aboutModal.classList.add('show');
    });
    document.getElementById('close-about-btn').addEventListener('click', () => {
        aboutModal.classList.remove('show');
    });

    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) aboutModal.classList.remove('show');
    });

    function setActiveSidebarItem(identifier) {
        document.querySelectorAll('.modal-sidebar .sidebar-item').forEach(item => {
            if (item.dataset.packName === identifier || item.id === identifier) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    if (browserExtensionMode) {
        document.getElementById('sidebar-add-new').style.display = 'none';
    }
    const themeModal = document.getElementById('theme-modal');

    document.getElementById('plugin-btn').addEventListener('click', () => pluginModal.classList.add('show'));
    const themeSidebar = document.getElementById('theme-sidebar');
    const themeDetailsView = document.getElementById('theme-details-view');
    const addThemeView = document.getElementById('add-theme-view');

    document.getElementById('theme-btn').addEventListener('click', () => {
        renderThemeSidebar();
        showThemeDetailsView('Dark Night (Default)');
        themeModal.classList.add('show');
    });

    const renderThemeSidebar = () => {
        themeSidebar.innerHTML = '';
        const addItem = document.createElement('div');
        addItem.className = 'sidebar-item';
        addItem.id = 'sidebar-add-theme';
        addItem.innerHTML = `<strong>Add New Theme</strong>`;
        addItem.addEventListener('click', showAddThemeView);
        themeSidebar.appendChild(addItem);

        [...defaultThemes, ...customThemes].forEach(theme => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.dataset.themeName = theme.name;
            item.innerHTML = `<strong>${theme.name}</strong>`;
            item.addEventListener('click', () => showThemeDetailsView(theme.name));
            themeSidebar.appendChild(item);
        });
    };

    const showAddThemeView = () => {
        themeDetailsView.style.display = 'none';
        addThemeView.style.display = 'block';
        setActiveThemeSidebarItem('sidebar-add-theme');
    };

    const showThemeDetailsView = (themeName) => {
        const allThemes = [...defaultThemes, ...customThemes];
        const theme = allThemes.find(t => t.name === themeName);
        if (!theme) return;

        document.getElementById('theme-detail-name').textContent = theme.name;

        // Update the preview
        const previewFrame = document.getElementById('theme-preview-iframe');
        const previewHTML = `
<style>
    ${theme.css}
body {margin: 0;background-color: var(--background-color);display: flex;flex-direction: column;height: 100vh;overflow: hidden;}
.top-bar {display: flex;align-items: center;padding: 0 12px;height: 40px;background-color: var(--panel-color);border-bottom: 1px solid var(--panel-border-color);flex-shrink: 0;margin: var(--window-gap) var(--window-gap) 0 var(--window-gap);border-radius: var(--panel-radius);}
.logo { width: 24px; margin-right: 8px; }
.dropdown-content a:hover { background-color: var(--menu-hover-color); }
.controls { margin-left: auto; }
button {border: none;padding: 6px 12px;margin-left: 8px;font-size: 0.8rem;display: inline-flex;align-items: center;border-radius: var(--button-radius);}
.main-content {display: flex;flex: 1;height: calc(200vh - 40px - 20px);}
.output-container {display: flex;flex-direction: column;flex: 1;padding: 8px;}
.output {background-color: var(--foreground-color);border-radius: var(--panel-radius);border: 1px solid #333;padding: 0.6rem;white-space: pre-wrap;flex: 1;overflow-y: auto;}
.resizer {background-color: var(--panel-color);width: 4px;flex-shrink: 0;border-radius: var(--small-radius);margin-top: var(--inner-gap);margin-bottom: var(--inner-gap);}
.status-bar {height: 20px;background-color: var(--panel-color);border-top: 1px solid #333;display: flex;align-items: center;padding: 0 12px;font-size: 0.72rem;flex-shrink: 0;margin: 0 var(--window-gap) var(--window-gap) var(--window-gap);border-radius: var(--panel-radius);}
.icon-sidebar {width: 40px;background-color: var(--panel-color);overflow-y: auto;flex-shrink: 0;display: flex;flex-direction: column;align-items: center;padding-top: 12px;gap: 16px;border-radius: var(--panel-radius);margin: var(--inner-gap) 0 var(--inner-gap) var(--window-gap);}
.dropdown-example {border: none;padding: 6px 12px;margin-left: 8px;display: inline-flex;align-items: center;width: 16px;border-radius: var(--small-radius);}
</style><div class="top-bar"><img src="icons/LunaCode-logo.png" alt="Novascript Logo" class="logo">
    <div class="menu-bar"><div class="dropdown-example" style="background: var(--text-color)"></div><div class="dropdown-example" style="background: var(--secondary-text-color)"></div><div class="dropdown-example" style="background: var(--darker-text-color)"></div><div class="dropdown-example" style="background: var(--button-text-color)"></div></div>
    <div class="controls"><button style="color: var(--accent-color); background-color: var(--accent-color);">placehold</button><button style="color: var(--danger-color); background-color: var(--danger-color);">placehold</button><button style="color: var(--discard-color); background-color: var(--discard-color);">placehold</button>
</div></div><div class="main-content"><div class="icon-sidebar"></div><div class="output-container"><pre class="output" style="margin-bottom: 0;margin-top: 0;"><div class="dropdown-example" style="background: var(--token-keyword-color)"></div><div class="dropdown-example" style="background: var(--token-function-color)"></div><div class="dropdown-example" style="background: var(--token-variable-color)"></div><div class="dropdown-example" style="background: var(--token-identifier-color)"></div><div class="dropdown-example" style="background: var(--token-operator-color)"></div><div class="dropdown-example" style="background: var(--token-boolean-color)"></div><div class="dropdown-example" style="background: var(--token-builtin-color)"></div><div class="dropdown-example" style="background: var(--token-comment-color)"></div><div class="dropdown-example" style="background: var(--token-punctuation-color)"></div><div class="dropdown-example" style="background: var(--token-string-color)"></div></pre></div><div class="resizer" id="resizer"></div><div class="output-container"><pre class="output" style="margin-bottom: 0;margin-top: 0;"></pre></div></div><div class="status-bar"></div>
        `;
        previewFrame.srcdoc = previewHTML;

        const actionsContainer = document.getElementById('theme-actions');
        actionsContainer.innerHTML = ''; // Clear old buttons

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply Theme';
        applyBtn.addEventListener('click', () => applyTheme(theme.name, theme.css));
        actionsContainer.appendChild(applyBtn);

        if (!theme.isDefault) {
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove Theme';
            removeBtn.style.backgroundColor = '#c93c3c';
            removeBtn.addEventListener('click', () => {
                const themeIndex = customThemes.findIndex(t => t.name === theme.name);
                if (themeIndex > -1) {
                    customThemes.splice(themeIndex, 1);
                    saveCustomThemes();
                    renderThemeSidebar();
                    showThemeDetailsView('Nova Dark (Default)'); // Go back to default view
                }
            });
            actionsContainer.appendChild(removeBtn);
        }

        addThemeView.style.display = 'none';
        themeDetailsView.style.display = 'flex';
        setActiveThemeSidebarItem(themeName);
    };

    const setActiveThemeSidebarItem = (themeName) => {
        document.querySelectorAll('#theme-sidebar .sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.themeName === themeName || item.id === themeName);
        });
    };

    document.getElementById('add-theme-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('new-theme-name');
        const cssInput = document.getElementById('theme-css-input');
        const errorDisplay = document.getElementById('theme-error');
        errorDisplay.textContent = '';
        const name = nameInput.value.trim();
        const css = cssInput.value.trim();

        if (!name || !css) {
            errorDisplay.textContent = 'Theme name and CSS content cannot be empty.';
            return;
        }
        if ([...defaultThemes, ...customThemes].some(t => t.name === name)) {
            errorDisplay.textContent = 'A theme with this name already exists.';
            return;
        }

        const newTheme = {name, css, isDefault: false};
        customThemes.push(newTheme);
        saveCustomThemes();
        renderThemeSidebar();
        showThemeDetailsView(name);
        nameInput.value = '';
        cssInput.value = '';
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.classList.remove('show');
        }
    });
})