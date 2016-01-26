app.directive('transactionsSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        controller: function($scope, transactionsService, $filter, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account',
                'Category', 'Amount', 'Balance', 'Status'];
            $scope.transactions = [];
            var date = new Date();
            $scope.filterProperties = {
                date: {
                    start: null,
                    end: date
                },
                description: '',
                accountId: '',
                categoryId: '',
                statusId: ''
            };

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

                transactionsService.service('GET', 'categories').then(function(response){
                    promises.push($scope.categories = response);
                });

                transactionsService.service('GET', 'status').then(function(response){
                    promises.push($scope.status = response);
                });

                transactionsService.service('GET', 'accounts').then(function(response){
                    promises.push($scope.accounts = response);
                });

                $q.all(promises).then(function() {
                    defer.resolve();
                });

                return defer.promise;
            }
            initTransactions();

            this.getData = function() {
                var defer = $q.defer();

                transactionsService
                    .service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){

                    $scope.transactions = $filter('filterSearchTransaction')
                        (response, $scope.filterProperties);

                    $scope.filterProperties = {
                        date: {
                            start: null,
                            end: date
                        },
                        description: '',
                        accountId: '',
                        categoryId: '',
                        statusId: ''
                    };

                    defer.resolve();
                });

                return defer.promise;
            };

            this.startData = function() {
                var defer = $q.defer();
                defer.resolve($scope.transactions = []);
                return defer.promise;
            }
        },
        link: function(scope, element, attrs, ctrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');

            syncElement.hide();

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                ctrl.startData().then(function() {
                    searchElement.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            ctrl.getData().then(function() {
                                syncElement.fadeOut().promise().done(function() {
                                    searchElement.fadeIn();
                                });
                            });
                        });
                    });
                });
            };
        }
    }
});

app.filter('filterSearchTransaction', ['$filter', '$q', function($filter) {
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