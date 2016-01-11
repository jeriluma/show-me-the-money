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

            syncElement.hide();

            scope.transaction = {
                date: "2016-01-03",
                description: "",
                accountId: 1,
                categoryId: 0,
                statusId: 1,
                parentId: 1,
                amount: "0"
            };

            scope.add = function(event) {
                event.preventDefault(); // prevents page refresh

                if(valid()) {
                    syncElement.fadeIn().promise().done(function() {
                        transactionCtrl.add(scope.transaction).then(function() {
                            syncElement.fadeOut();
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