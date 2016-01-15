app.directive('transactionsSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {

        }
    }
});