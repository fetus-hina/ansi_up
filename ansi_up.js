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
    }

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
                self.fg = null;
                self.bg = null;
                self.bright_fg = false;
                self.bright_bg = false;
            } else if (num === 1) {
                self.bright_fg = true;
            } else if ((num >= 30) && (num < 38)) {
                self.fg = get_color_class_name(num % 10, true);
            } else if ((num >= 90) && (num < 98)) {
                self.fg = get_color_class_name(num % 10, true);
                self.bright_fg = true;
            } else if ((num >= 40) && (num < 48)) {
                self.bg = get_color_class_name(num % 10, false);
                self.bright_bg = false;
            } else if ((num >= 100) && (num < 108)) {
                self.bg = get_color_class_name(num % 10, false);
                self.bright_bg = false;
            }
        });

        if ((self.fg === null) && (self.bg === null)) {
            return orig_txt;
        } else {
            var classes = [];
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
