app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        require: '^transactionsTable',
        scope: true,
        link: function(scope, element, attrs, transactionsCtrl) {
            var data = $(element).find('.transaction-data');
            var editTrigger = $(element).find('.transaction-edit-trigger');
            var editingElement = $(element).find('.transaction-edit');
            var syncElement = $(element).find('.transaction-sync');
            var isEditing = false;

            editTrigger.hide();
            editingElement.hide();
            syncElement.hide();

            $(element).bind('mouseover', function() {
                if(!isEditing) {
                    editTrigger.fadeIn();
                }
            });

            $(element).bind('mouseleave', function() {
                if(!isEditing) {
                    editTrigger.fadeOut();
                }
            });

            $(editTrigger).bind('click', function() {
                data.fadeOut().promise().done(function() {
                    isEditing = true;
                    editingElement.fadeIn();
                    editTrigger.hide();
                });
            });

            scope.save = function(transaction, event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                editingElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        transactionsCtrl.edit(transaction).then(function () {
                            syncElement.fadeOut().promise().done(function() {
                                data.fadeIn(500).promise().done(function() {
                                    isEditing = false;
                                    editTrigger.show();
                                });
                            });
                        });
                    });
                });
            };

        }
    }
});