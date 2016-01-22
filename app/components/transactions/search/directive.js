app.directive('transactionsSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');

            syncElement.hide();

            var date = new Date();
            scope.transaction = {
                date: {
                    start: null,
                    end: date
                },
                description: '',
                accountId: '',
                categoryId: '',
                statusId: ''
            };

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                searchElement.fadeOut().promise().done(function() {
                    transactionCtrl.hideTable().then(function() {
                        syncElement.fadeIn().promise().done(function() {
                            transactionCtrl.search(scope.transaction).then(function() {
                                syncElement.fadeOut().promise().done(function() {
                                    searchElement.fadeIn();
                                    transactionCtrl.showTable();
                                });
                            });
                        });
                    });
                });
            };
        }
    }
});

app.filter('filterSearchTransaction', ['$filter', '$q', function($filter, $q) {
    return function(input, filterOptions) {
        var output = [];

        angular.forEach(input, function(transaction) {
            transaction.date = new Date(transaction.date);
            var validStartDate = filterOptions.date.start === null
                || transaction.date >= filterOptions.date.start;
            var validEndDate =  transaction.date <= filterOptions.date.end;
            var validAccountId = filterOptions.accountId === ''
                || transaction.accountId === filterOptions.accountId;
            var validCategoryId = filterOptions.categoryId === ''
                || transaction.categoryId === filterOptions.categoryId;
            var validStatusId = filterOptions.statusId === ''
                || transaction.statusId === filterOptions.statusId;

            if(validStartDate && validEndDate && validAccountId && validCategoryId && validStatusId) {
                output.push(transaction);
            }
        });

        if(filterOptions.description !== '') {
            output = $filter('filter')(output, filterOptions.description);
        }

        return output;
    }
}]);