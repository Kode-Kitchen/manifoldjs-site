import Ember from 'ember';
import colorConverter from './colorConverter/colorConverter';

export default Ember.Component.extend({
    color: '',
    lastColor: '',
    colorOption: undefined,
    canChooseColor: function() {
        return this.colorOption === "pick";
    }.property("colorOption"),
    watchTypeColorChoosen: function() {
        if (this.colorOption === "none") {
            this.set("color", "none");
        } else if (this.colorOption === "transparent") {
            this.set("color", "transparent");
        }
    }.observes("colorOption"),
    updateColorChoosen: function() {
        if (this.lastColor !== this.color && this.context._state !== 'preRender') {
            this.sendAction('action', 'background_color', this.color);
            this.set('lastColor', this.color);
        }
    }.observes("color"),
    calculateColorOption: function() {
        var converter = colorConverter.create();

        if(!this.color || this.color === "none") {
            this.set('colorOption', 'none');
        } else if (this.color === 'transparent') {
            this.set('colorOption', 'transparent');
        } else if (converter.isHexadecimal(this.color)) {
            this.set('colorOption', 'pick');
        } else if (converter.isAlias(this.color) || converter.isRGB(this.color) || converter.isHSL(this.color)) {
            this.set('colorOption', 'pick');
            //Component return the color in the four byte hexa.
            this.set('color', "#" + converter.toHexadecimal(this.color).slice(4, 10));
        } else {
            this.set('colorOption', 'none');
        }
    }.observes("color").on('init')
});