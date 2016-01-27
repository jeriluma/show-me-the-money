app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($rootScope, $scope, transactionsService) {
            this.isValid = function(transaction) {
                return transaction == transaction;
            };

            this.updateData = function(transaction) {
                transactionsService.service('PUT', 'transactions/' + transaction.id, transaction).then(function() {
                    transactionsService.setUpdateStatus(1);
                });
            };
        },
        link: function(scope, element, attrs, ctrl) {
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

                if(ctrl.isValid(transaction)) {
                    editingElement.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            ctrl.updateData(transaction);
                        });
                    });
                }
            };
        }
    }
});