/** @preserve
 * ansi_up.js
 * version : 1.1.3
 * author : Dru Nelson
 * license : MIT
 * http://github.com/drudru/ansi_up
 */
(function (global, undefined) {
    "use strict";

    var ansi_up;
    var VERSION = "1.1.3";
    var hasModule = (module !== undefined);
    var COLORS = [ "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white" ];

    function get_color_class_name(color_index, is_fg) {
        return "console-color-" + COLORS[color_index] + "-" + (is_fg ? "fg" : "bg");
    }

    function Ansi_Up() {
        this.fg = null;
        this.bg = null;
        this.bright_fg = false;
        this.bright_bg = false;
        this.styles = [];
    }

    Ansi_Up.prototype.add_style = function (klass) {
        this.styles.push(klass);
        return this;
    };

    Ansi_Up.prototype.remove_style = function (klass) {
        var self = this;
        if (Array.isArray(klass)) {
            for (var i = 0; i < klass.length; ++i) {
                self.remove_style(klass[i]);
            }
        } else {
            self.styles.some(function (v, i) {
                if (v === klass) {
                    self.styles.splice(i, 1);
                }
            });
        }
        return self;
    };

    Ansi_Up.prototype.escape_for_html = function (txt) {
        return txt.replace(/[&<>"']/gm, function(str) {
            if (str === "&") { return "&amp;"; }
            if (str === "<") { return "&lt;"; }
            if (str === ">") { return "&gt;"; }
            if (str === '"') { return "&quot;"; }
            if (str === "'") { return "&#39;"; }
        });
    };

    Ansi_Up.prototype.linkify = function (txt) {
        return txt.replace(/(https?:\/\/[^\s]+)/gm, function(str) {
            return "<a href=\"" + str + "\">" + str + "</a>";
        });
    };

    Ansi_Up.prototype.ansi_to_html = function (txt) {
        var data4 = txt.split(/\033\[/);
        var first = data4.shift(); // the first chunk is not the result of the split
        var self = this;
        var data5 = data4.map(function (chunk) {
            return self.process_chunk(chunk);
        });
        data5.unshift(first);

        var flattened_data = data5.reduce(function (a, b) {
            if (Array.isArray(b)) {
                return a.concat(b);
            }

            a.push(b);
            return a;
        }, []);

        return flattened_data.join('');
    };

    Ansi_Up.prototype.process_chunk = function (text) {
        // Each 'chunk' is the text after the CSI (ESC + '[') and before the next CSI/EOF.
        //
        // This regex matches two groups within a chunk.
        // The first group matches all of the number+semicolon command sequences
        // before the 'm' character. These are the graphics or SGR commands.
        // The second group is the text (including newlines) that is colored by
        // the first group's commands.
        var matches = text.match(/([\d;]*)m([\s\S]*)/m);

        if (!matches) {
            return text;
        }

        var orig_txt = matches[2];
        var nums = matches[1].split(';');

        var self = this;
        nums.map(function (num_str) {
            var num = parseInt(num_str);

            if (isNaN(num) || num === 0) {
                // すべての文字属性を解除
                self.fg = null;
                self.bg = null;
                self.bright_fg = false;
                self.bright_bg = false;
                self.styles = [];
            } else if (num === 1) {
                // 高輝度/太文字
                self.bright_fg = true;
            } else if (num === 2 || num === 22) {
                // 高輝度/太文字解除
                self.bright_fg = false;
            } else if (num === 3) {
                // イタリック
                self.add_style('console-style-italic');
            } else if (num === 4) {
                // 下線
                self.remove_style('console-style-double-underline')
                    .add_style('console-style-underline');
            } else if (num === 5) {
                // 低速点滅
                self.remove_style('console-style-blink-fast')
                    .add_style('console-style-blink-slow');
            } else if (num === 6) {
                // 高速点滅
                self.remove_style('console-style-blink-slow')
                    .add_style('console-style-blink-fast');
            } else if (num === 7) {
                // 文字色と背景色を入れ替える
                // TODO
            } else if (num === 8) {
                // 文字食を背景色と同じにする
                // TODO
            } else if (num === 9) {
                // 打消し線
                self.remove_style('console-style-double-strike')
                    .add_style('console-style-strike');
            } else if ((10 <= num) && (num <= 20)) {
                // フォント設定（無視）
            } else if (num === 21) {
                // 二重下線
                self.remove_style('console-style-underline')
                    .add_style('console-style-double-underline');
            } else if (num === 23) {
                // イタリック解除
                self.remove_style('console-style-italic');
            } else if (num === 24) {
                // 下線解除
                self.remove_style([
                    'console-style-underline',
                    'console-style-double-underline'
                ]);
            } else if (num === 25) {
                // 点滅解除
                self.remove_style([
                    'console-style-blink-slow',
                    'console-style-blink-fast'
                ]);
            } else if (num === 27 || num === 28) {
                // 差し替えた文字色・背景色をもとに戻す
                // TODO
            } else if (num === 29) {
                // 打消し線を解除
                self.remove_style([
                    'console-style-strike',
                    'console-style-double-strike'
                ]);
            } else if ((num >= 30) && (num < 38)) {
                // 文字色の設定
                self.fg = get_color_class_name(num % 10, true);
            } else if (num === 39) {
                // 文字色を戻す
                self.fg = null;
            } else if ((num >= 40) && (num < 48)) {
                // 背景色の設定
                self.bg = get_color_class_name(num % 10, false);
                self.bright_bg = false;
            } else if (num === 48) {
                // TODO 文字色の拡張設定
            } else if (num === 49) {
                // 背景色を戻す
                self.bg = null;
            } else if (num === 53) {
                // 上線を設定
                self.add_style('console-style-overline');
            } else if (num === 55) {
                // 上線を解除
                self.remove_style('console-style-overline');
            } else if (num === 64) {
                // 二重打消し線
                self.remove_style('console-style-strike')
                    .add_style('console-style-double-strike');
            } else if (num === 65) {
                // 60-65 で設定された内容を取り消し
                self.remove_style([
                    'console-style-strike',
                    'console-style-double-strike'
                ]);
            } else if ((num >= 90) && (num < 98)) {
                self.fg = get_color_class_name(num % 10, true);
                self.bright_fg = true;
            } else if ((num >= 100) && (num < 108)) {
                self.bg = get_color_class_name(num % 10, false);
                self.bright_bg = false;
            }
        });

        var classes = self.styles.concat();
        if (self.fg) {
            classes.push(self.fg);
            if (self.bright_fg) {
                classes.push("bright-fg");
            }
        }
        if (self.bg) {
            classes.push(self.bg);
            if (self.bright_bg) {
                classes.push("bright-bg");
            }
        }
        if ((self.fg === null) && (self.bg === null) && (classes.length < 1)) {
            return orig_txt;
        } else {
            return ["<span class=\"" + classes.join(' ') + "\">", orig_txt, "</span>"];
        }
    };

    // Module exports
    ansi_up = {
        escape_for_html: function (txt) {
            var a2h = new Ansi_Up();
            return a2h.escape_for_html(txt);
        },

        linkify: function (txt) {
            var a2h = new Ansi_Up();
            return a2h.linkify(txt);
        },

        ansi_to_html: function (txt, options) {
            var a2h = new Ansi_Up();
            return a2h.ansi_to_html(txt, options);
        },

        ansi_to_html_obj: function () {
            return new Ansi_Up();
        },

        "VERSION": VERSION,
    };

    // CommonJS module is defined
    if (hasModule) {
        module.exports = ansi_up;
    }
    global.ansi_up = ansi_up;
})(("global",eval)("this"));
