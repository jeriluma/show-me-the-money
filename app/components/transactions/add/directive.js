app.directive('transactionsAdd', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/add/view.html',
        require: '?transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {

        }
    }
});