backbone.marionette.rivets
==========================

add rivets to backbone.marionette

##ItemView:
###override: 
- `_renderTemplate` for add rivets binding and call getTemplateData
- `destroy` for unbinding rivets

###new method:
- `getTemplateData` : renderTemplate call this method instead of serialiazeData. By default get Model or Collection of the view.
- `_oldRenderTemplate`: old method
- `oldDestroy`: old method

#Installation:

You can install using the package manager of your choice. We currently maintain releases on npm, jam and bower (recommended).

```sh
bower install backbone.marionette.rivets
```
