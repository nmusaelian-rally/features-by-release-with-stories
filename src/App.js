Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a Release:',
        labelWidth: 100,
        width: 300
    },

    addContent: function() {
        this._makeStore();
    },
    
    _makeStore: function(){
         console.log('_makeStore');
         Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            fetch: ['FormattedID','Name'],
            pageSize: 100,
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    
   onScopeChange: function() {
        this._makeStore();
    },
    
    _onDataLoaded: function(store, data){
                var features = [];
                var pendingstories = data.length;
                if (data.length ===0) {
                        this._createGrid(features);  //to force refresh on testset grid when there are no testsets in the iteration
                }
                Ext.Array.each(data, function(feature) {
                            var f  = {
                                FormattedID: feature.get('FormattedID'),
                                Name: feature.get('Name'),
                                Release: (feature.get('Release') && feature.get('Release')._refObjectName) || 'None',
                                _ref: feature.get("_ref"),
                                StoryCount: feature.get('UserStories').Count,
                                UserStories: []
                            };
                            
                        var stories = feature.getCollection('UserStories', {fetch: ['FormattedID','Owner']});
                           stories.load({
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(story){
                                        f.DefectCount += story.get('Defects').Count;
                                            f.UserStories.push({
                                            _ref: story.get('_ref'),
                                            FormattedID: story.get('FormattedID'),
                                            Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None'
                                                    });
                                    }, this);
                                    
                                    --pendingstories;
                                    if (pendingstories === 0) {
                                        this._createGrid(features);
                                    }
                                },
                                scope: this
                            });
                            features.push(f);
                }, this);
    },
    
    _createGrid: function(features) {
        var featureStore = Ext.create('Rally.data.custom.Store', {
                data: features,
                pageSize: 100,
                remoteSort:false
            });
        
        if (!this.down('#fgrid')){
         this.add({
            xtype: 'rallygrid',
            itemId: 'fgrid',
            store: featureStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Story Count', dataIndex: 'StoryCount'
                },
                {
                    text: 'Release', dataIndex: 'Release'
                },
                {
                    text: 'User Stories', dataIndex: 'UserStories', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(userstory){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(userstory) + '">' + userstory.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                },
                {
                    text: 'Story Owner', dataIndex: 'UserStories', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(userstory){
                            html.push(userstory.Owner);
                        });
                        return html.join(', ');
                    }
                }
            ]
            
        });
        }
        else{
            this.down('#fgrid').reconfigure(featureStore);
        }
    }
       
});
