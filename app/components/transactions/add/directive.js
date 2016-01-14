app.directive('transactionsAdd', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'app/components/transactions/add/view.html',
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {
            var form = $(element).find('.transaction-form');
            var syncElement = $(element).find('.transaction-sync');
            var button = $(element).find('.transaction-submit');

            syncElement.hide();

            var date = new Date();

            scope.transaction = {
                date: date,
                description: "",
                accountId: 0,
                categoryId: 0,
                statusId: 0,
                parentId: 0
            };

            scope.add = function(event) {
                event.preventDefault(); // prevents page refresh

                if(valid()) {
                    button.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            transactionCtrl.add(scope.transaction).then(function() {
                                syncElement.fadeOut().promise().done(function() {
                                    button.fadeIn();
                                });
                            });
                        });
                    });
                } else {

                }
            };

            function valid() {
                var isValid = true;

                if(scope.transaction.description === '') {
                    isValid = false;
                }

                if(scope.transaction.amount === 0) {
                    isValid = false;
                }

                return isValid;
            }
        }
    }
});