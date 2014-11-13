Marionette.ItemView.prototype.getTemplateData = function() {
    var data;
    if (this.model) {
        data = {
            model: this.model
        };
    } else if (this.collection) {
        data = {
            items: this.collection
        };
    }

    return data;
};

Marionette.ItemView.prototype._oldRenderTemplate = Marionette.ItemView.prototype._renderTemplate;

Marionette.ItemView.prototype._renderTemplate = function() {
    var template = this.getTemplate();

    // Allow template-less item views
    if (template === false) {
        return;
    }

    if (!template) {
        throw new Marionette.Error({
            name: 'UndefinedTemplateError',
            message: 'Cannot render the template since it is null or undefined.'
        });
    }

    // Add in entity data and template helpers
    var data = this.getTemplateData();
    data = this.mixinTemplateHelpers(data);

    // Render and add to el
    var html = Marionette.Renderer.render(template, {}, this);
    this.attachElContent(html);

    this.binder = rivets.bind(this.el, data);

    return this;
};

Marionette.ItemView.prototype.oldDestroy = Marionette.ItemView.prototype.destroy;

Marionette.ItemView.prototype.destroy = function() {
    if (this.isDestroyed) {
        return;
    }

    if (this.binder) {
      this.binder.unbind();  
    } 

    return Marionette.View.prototype.destroy.apply(this, arguments);
};