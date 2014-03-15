module.exports = '<div>\n  <div style="margin:10px 0 0 0;" >\n    <h4 ng-show="showform || showdelete || showfolderform">{{ edit_container.models[0].name | ucfirst }}</h4>\n  </div>\n\n  <div ng-show="showadd && !showform"  class="pull-left">\n    <button class="btn btn-primary" ng-click="addclicked()">Add {{ blueprintname }}</button>\n  </div>\n  \n  <div ng-show="folder_mode && showadd && !showform" class="pull-left" style="margin-left:10px">\n    <button class="btn btn-primary" ng-click="editfolderclicked()">Edit {{ itemtype }}</button>\n  </div>\n\n\n  <!--\n    delete\n   -->\n  <div ng-show="showdelete">  \n\n    <div class="well">\n      Are you sure you want to delete {{ edit_container.models[0].name }}?\n    </div>\n\n    <button class="btn" ng-click="deleteclick(false)">No - Cancel</button>\n    <button class="btn btn-danger" ng-click="deleteclick(true)">Yes - Delete</button>\n  </div>\n\n  <!--\n    form\n   -->\n  <div ng-show="showform">\n\n      <fieldset>\n\n\n        <!--\n          THIS IS TRANSCLUDED SO YOU CAN PASS ANY FORM\n         -->\n        <div class="well">\n          <div>\n            <digger-viewer settings="settings" blueprint="blueprint" container="edit_container" extra_fields="settings.extra_fields" iconfn="settings.iconfn">\n            </digger-form>\n          </div>\n\n          <div ng-transclude>\n          </div>\n\n        </div>\n        \n        <button class="btn" ng-click="cancelform()">Cancel</button>\n        <button class="btn btn-warning" ng-show="formactiontitle==\'Save\'" ng-click="deleterow(edit_container)">Delete</button>\n        <button class="btn btn-success" ng-click="submitform()">{{ formactiontitle }} {{ edit_container.models[0].name | ucfirst }}</button>\n        \n      </fieldset>\n\n  </div>\n\n</div>';