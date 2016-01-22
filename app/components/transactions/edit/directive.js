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
            var isHover = false;
            var isEditing = false;

            editTrigger.hide();
            editingElement.hide();
            syncElement.hide();

            $(element).bind('mouseover', function() {
                $(element).removeClass('pointer');
                if(!isEditing) {
                    $(element).addClass('pointer');
                    editTrigger.fadeIn().promise().done(function() {
                        isHover = true;
                    });
                }
            });

            $(element).bind('mouseleave', function() {
                $(element).removeClass('pointer');
                if(!isEditing) {
                    $(element).addClass('pointer');
                    editTrigger.fadeOut().promise().done(function() {
                        isHover = false;
                    });
                }
            });

            $(element).bind('click', function() {
                if(isHover) {
                    isEditing = true;
                    isHover = false;
                    editTrigger.hide().promise().done(function() {
                        data.fadeOut().promise().done(function() {
                            editingElement.fadeIn();
                        });
                    });
                }
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