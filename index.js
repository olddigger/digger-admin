var modulename = module.exports = 'digger.admin';

var templates = {
  simpletable:require('./simpletable'),
  simpleeditor:require('./simpleeditor'),
  crudeditor:require('./crudeditor'),
  pagination:require('./pagination'),
  buttonrow:require('./buttonrow')
}

var fields = {
  file:require('./fields/file')
}

var blueprintxml = require('./blueprints.xml.js');

angular
  .module(modulename, [
    require('digger-editor'),
    require('file-uploader')
  ])

  .run(function(){

    Object.keys(fields || {}).forEach(function(key){
      $digger.blueprint.add_template(key, fields[key]);
    })

    var blueprints = $digger.create(blueprintxml);
    $digger.blueprint.inject(blueprints);

  })

  .factory('$pathSelector', function() {

    return function(path){

      return (path || '').split('/').filter(function(id){
        return id && id.match(/\w/);
      }).map(function(id){
        return 'folder#' + id;
      }).join(' > ')
      
    }

  })


  .directive('crudEditor', function($safeApply, $containerTreeData, $getAncestors, $pathSelector){

    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        container:'=',
        settings:'='
      },
      replace:true,
      transclude:true,
      template:templates.crudeditor,
      controller:function($scope){

        $scope.showform = false;
        $scope.deleting = false;

        $scope.selector = {
          limit:'',
          search:''
        }

        $scope.pagination = {
          count:0,
          pagesize:100
        }

        $scope.mode = 'overview';

        var load_trigger = null;
        var selector = '> *';

        $scope.load_children = function(){

          $scope.folders = [];
          $scope.items = [];
          var limit = $scope.selector.limit || '0,100';

          $scope.edit_container(selector + ':limit(' + limit + ')').ship(function(children){
            
            $safeApply($scope, function(){

              $scope.folders = children.find('folder').containers();
              $scope.items = children.find('folder:not').containers();

            })
          })
        }

        $scope.run_selector = function(){

          if(!$scope.edit_container || $scope.edit_container.models.length<=0){
            $scope.edit_container = $scope.container;
          }
          $scope.edit_container(selector + ':count').ship(function(results){
            $safeApply($scope, function(){
              $scope.pagination.count = results.attr('count');
            })
          })

          $scope.load_children();
          
        }

        $scope.select_container = function(container){
          $scope.edit_container = container;
          $scope.run_selector();
          var parent = $scope.get_parent(container);

          if(parent.count()<=0){
            if(container.diggerid()!=$scope.tree_root.diggerid()){
              parent = $scope.tree_root;
            }
          }
          $scope.$broadcast('admin:parent', parent);

          

          
        }

        $scope.load_tree = function(selectcontainer){
          $scope.tree_root('> *:tree(folder)').ship(function(tree){
            $safeApply($scope, function(){
              $scope.tree_root.get(0)._children = tree.models;
              $scope.$emit('crud:tree:loaded');
              $scope.$broadcast('tree:select', selectcontainer);
              $scope.$broadcast('tree:expand', selectcontainer);
            })
          })
          $scope.select_container(selectcontainer || $scope.tree_root);
        }


        $scope.get_parent = function(container){
          var parent = $scope.tree_root.find('=' + container.diggerparentid());
          if(!parent){
            parent = $scope.tree_root;
          }
          return parent;
        }


        // load the tree data
        $scope.$watch('container', function(container){
          if(!container){
            return container;
          }
          $scope.tree_root = container;
          $scope.load_tree(container);
        })


        $scope.$on('tree:selected', function($e, container){
          $scope.select_container(container);
          $scope.$broadcast('admin:reset', container);       
        })

        $scope.$on('table:edit', function($ev, container){
          if(container.is('folder')){
            $scope.$broadcast('tree:select', container);
            $scope.$broadcast('tree:expand', container);  
          }
          
          $scope.select_container(container);
        })

        $scope.$on('table:delete', function($ev, container){
          $scope.$broadcast('admin:delete', container);
        })

        $scope.$watch('selector.limit', function(){
          $scope.load_children();
        })

        $scope.$on('pagination:change', function($ev, pagination){
          $scope.selector.limit = pagination;
        })

        $scope.$on('admin:form', function($ev, mode){
          $safeApply($scope, function(){
            $scope.mode = mode ? 'form' : 'overview';
          })
          
        })

        $scope.$on('admin:confirmdelete', function($ev, container){
          var parent = $scope.get_parent(container);
          $scope.load_tree(parent);
        })

        $scope.$on('admin:confirmdelete', function($ev, container){
          var parent = $scope.tree_root.find('=' + container.diggerparentid());
          if(!parent){
            parent = $scope.tree_root;
          }
          $scope.load_tree(parent);
        })

        $scope.$on('editor:add', function($ev, container, parent){
          $scope.load_tree(parent);

        })

        $scope.$on('admin:up', function($ev, container){
          if(!container){
            return;
          }
          if(container.is('folder') || container.is('_supplychain')){
            $scope.$broadcast('tree:select', container);
            $scope.$broadcast('tree:expand', container);  
          }
          $scope.select_container(container);
        })

        $scope.$on('editor:save', function(){
          $scope.load_children();
        })

        $scope.$on('admin:deleteflag', function($ev, mode){
          $scope.deleting = mode;
        })

    

      },
      link:function($scope, $elem, $attrs){
        
        // back to top
        setTimeout(function () {

          $('#treeholder').affix({
            offset: {
              top: 0
            , bottom: function () {
                return (this.bottom = $('#footer').outerHeight(true))
              }
            }
          })
            
        }, 100)
      }
    }
  })



  .directive('folderEditor', function($safeApply){

    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        container:'=',
        settings:'='
      },
      replace:true,
      template:'<div><digger-editor container="container" settings="settings" /></div>',
      controller:function($scope){

        $scope.depth = $scope.depth || 4;
        $scope.treedata = [];
        
        $scope.$watch('container', function(container){
          if(!container){
            return;
          }

          container.recurse(function(c){
            c.data('showattributes', true);
          })

          $scope.treedata = container.models;

        })
      }
    }
  })

  .directive('simpleEditor', function($growl, $safeApply){

    return {
      restrict:'EA',
      scope:{
        container:'=',
        settings:'='
      },
      replace:true,
      transclude:true,
      template:templates.simpleeditor,
      controller:function($scope){

        $scope.mode = 'overview';
        $scope.settings = $scope.settings || {};
        $scope.folderblueprint = $digger.blueprint.get('folder');

        $scope.$watch('container', function(container){
          if(!container){
            return;
          }
          $scope.updatecontainer();
        })

        $scope.$on('admin:parent', function($ev, parent){
          $scope.hitparent = parent;
          $scope.parent = parent && parent.count()>0;
        })

        

        $scope.$on('admin:reset', function($ev, container){
          $scope.cancelform();
        })

        $scope.$on('admin:edit', function($ev, container){
          $safeApply($scope, function(){
            $scope.editrow(container);
          })
          
        })

        $scope.$on('admin:delete', function($ev, container){
          $safeApply($scope, function(){
            $scope.deleterow(container);
          })
          
        })
        $scope.updatecontainer = function(){

          $scope.itemtype = $scope.container.tag();
          $scope.edit_mode = $scope.container.tag()!='_supplychain';
          $scope.addblueprints = $scope.settings.blueprintfn ? $scope.settings.blueprintfn($scope.container) : [$digger.blueprint.get('folder')];
          $scope.edit_container = $scope.container;
          $scope.$emit('editor:update', $scope.container);

          var blueprint = $digger.blueprint.for_container($scope.container);

          if(blueprint && blueprint.attr('leaf')){
            $scope.leaf = true;
            $scope.editrow($scope.container);
          }
          else{
            $scope.leaf = false;
          }
        }

        $scope.addclicked = function(blueprint){
          $scope.blueprintname = blueprint.title();
          $scope.edit_container = $digger.blueprint.create(blueprint);
          $scope.edit_mode = true;
          $scope.blueprint = blueprint;

          $scope.edit_container.diggerwarehouse($scope.container.diggerwarehouse());

          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.dir($scope.edit_container.toJSON());
          
          $scope.formtitle = 'New ' + ($scope.blueprintname.replace(/^./, function(st){
            return (st || '').toUpperCase();
          }));

          $scope.formactiontitle = 'Add';

          $scope.$emit('admin:new', $scope.edit_container);
          $scope.$emit('admin:form', true);
          $scope.mode = 'edit';
          $scope.clickmode = 'add';
        }
        
        $scope.editrow = function(row){

          $scope.formtitle = row.title();
          $scope.formactiontitle = 'Save';
          $scope.edit_container = row;
          $scope.blueprint = $digger.blueprint.for_container(row);
          
          $scope.canceldata = JSON.parse(JSON.stringify(row.models))

          $scope.$emit('admin:select', row);
          $scope.$emit('admin:form', true);
          $scope.mode = 'edit';
          $scope.clickmode = 'edit';
        }

        $scope.goup = function(){
          $scope.$emit('admin:up', $scope.hitparent);
        }


        $scope.cancelform = function(){
          
          $scope.formactiontitle = 'Add';
          if($scope.canceldata){
            $scope.edit_container.models = $scope.canceldata;  
          }
          $scope.edit_mode = $scope.container.tag()!='_supplychain';
          $scope.canceldata = null;
          $scope.edit_container = null;
          $scope.$emit('admin:cancel');
          $scope.$emit('admin:form', false);
          $scope.mode = 'overview';
          if($scope.leaf){
            $scope.$emit('admin:up', $scope.hitparent);
          }
        }

        $scope.deleterow = function(row, event){
          $scope.formtitle = 'Delete?';
          $scope.delete_container = row;
          $scope.$emit('admin:deleteflag', true);
          //$scope.$emit('admin:form', true);
          $scope.mode = 'delete';
        }

        $scope.confirmdelete = function(mode){
          if(!mode){
            $scope.mode = 'overview';
            $scope.$emit('admin:deleteflag', false);
            $scope.$emit('admin:form', false);
          }
          else{
            var title = $scope.delete_container.title();
            var removing = $scope.delete_container;
            $scope.edit_container = null;
            removing.remove().ship(function(){
              $safeApply($scope, function(){
                $growl(title + " removed");
                $scope.$emit('admin:confirmdelete', removing);
                $scope.mode = 'overview';
                $scope.$emit('admin:deleteflag', false);
                $scope.$emit('admin:form', false);
              })
              
            })
          }
          
        }    

        $scope.submitform = function(){

          function normal_add(newcontainer){

            $scope.container.append(newcontainer).ship(function(){
              $growl(newcontainer.title() + " added");
              
              
              if($scope.settings.post_append){
                $scope.settings.post_append(newcontainer);
              }
              else{
                
                $safeApply($scope, function(){
                  $scope.cancelform();
                  $scope.$emit('editor:add', newcontainer, $scope.container);
                })
              }
              
            })
          }

          function normal_save(savecontainer){

            savecontainer.save().ship(function(){
              $growl(savecontainer.title() + " saved");

              
              $safeApply($scope, function(){
                $scope.cancelform();
                $scope.$emit('editor:save', savecontainer);
              })
            })
            
          }

          if($scope.clickmode=='add'){
            var newcontainer = $scope.edit_container;

            if($scope.settings.process_add){
              $scope.settings.process_add(newcontainer, function(){
                $safeApply($scope, function(){
                  normal_add(newcontainer);
                })
              })
            }
            else{
              normal_add(newcontainer);
            }

          }
          else{
            var savecontainer = $scope.edit_container;

            if($scope.settings.process_save){
              $scope.settings.process_save(savecontainer, function(){
                $safeApply($scope, function(){
                  normal_save(savecontainer);
                })
              })
            }
            else{
              normal_save(savecontainer);
            }

          }
        }
      }
    }
  })

  .directive('simpleTable', function(){


    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        rows:'=',
        iconfn:'=',
        search:'='
      },
      replace:true,
      template:templates.simpletable,
      link:function($scope, elem, $attrs){

        $scope.showsummary = true;

        $scope.editrow = function(container){

          $scope.$emit('table:edit', container);

        }

        $scope.deleterow = function(container){

          $scope.$emit('table:delete', container);

        }
      }
    }
  })



  .directive('buttonrow', function(){


    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:true,
      replace:true,
      template:templates.buttonrow,
      link:function($scope, elem, $attrs){
        $scope.buttonclass = $attrs.buttonclass || 'btn-sm';
      }
    }
  })
  .directive('pagination', function(){


    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        count:'=',
        pagesize:'='
      },
      replace:true,
      template:templates.pagination,
      link:function($scope, elem, $attrs){

        $scope.activepage = 0;
        $scope.active = true;
        $scope.pages = [];

        $scope.selectPrevious = function(){
          $scope.activepage--;
          if($scope.activepage<0){
            $scope.activepage = 0;
          }
        }

        $scope.selectNext = function(){
          $scope.activepage++;
          if($scope.activepage>$scope.pages.length-1){
            $scope.activepage = $scope.pages.length-1;
          }
        }

        $scope.selectPage = function(index){
          $scope.activepage = index;
        }

        $scope.$watch('activepage', function(activepage){
          var st = ($scope.activepage * $scope.pagesize) + ',' + $scope.pagesize;
          $scope.$emit('pagination:change', st);
        })

        $scope.$watch('count', function(count){
          
          if(!count){
            $scope.active = false;
            return;
          }
          if(!$scope.pagesize){
            $scope.active = false;
            return;
          }
          $scope.active = true;

          var pages = [];
          var page_count = Math.ceil(count / $scope.pagesize);
          
          for(var i=0; i<page_count; i++){
            pages.push(i);
          }

          $scope.pages = pages;
        })
      }
    }
  })

  .factory('$growl', function(){
    return function(message, type){
      type = type || 'info';
      //window.scrollTo(0,0);

      var appendto = $('.add-growl');

      var elemselector = appendto.length>0 ? appendto : 'body';
      $.bootstrapGrowl(message, {
        ele: elemselector, // which element to append to
        type: type, // (null, 'info', 'error', 'success')
        offset: {from: 'top', amount: 20}, // 'top', or 'bottom'
        align: 'right', // ('left', 'right', or 'center')
        width: 250, // (integer, or 'auto')
        delay: 4000,
        allow_dismiss: true,
        stackup_spacing: 10 // spacing between consecutively stacked growls.
      });
    }
  })