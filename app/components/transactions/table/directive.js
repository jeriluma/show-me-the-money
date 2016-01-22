app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $q, $filter) {

            // Initialization

            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = [];

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

                promises.push($scope.loading = true);

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

            initTransactions().then(function() {
                transactionsService.service('GET', 'transactions?_sort=date&_order=DESC').then(function(response){
                    runBalances(response).then(function(response){
                        $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
                        $scope.transactions = response;
                        $scope.loading = false;
                    });
                });
            });

            $scope.transformDate = function(date) {
                return new Date(date);
            };

            $scope.formatDate = function(date) {
                return (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
            };

            function runBalances(transactions) {
                var defer = $q.defer();

                var totalBalance = 0;
                var categoryState = 1;
                for(var i = transactions.length - 1; i >= 0; i--) {
                    var transaction = transactions[i];

                    if($scope.categories[transaction.categoryId]
                        && $scope.categories[transaction.categoryId].parentId === "Expense") {
                        categoryState = -1;
                    } else {
                        categoryState = 1;
                    }

                    transaction.balance = totalBalance + categoryState * transaction.amount;
                    totalBalance = transaction.balance;
                }

                defer.resolve(transactions);

                return defer.promise;
            }

            // questionable how fast this will run...
            function updateTransactions(method, url, transaction) {
                var defer = $q.defer();

                transactionsService.service(method, url, transaction).then(function() {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC').then(function(response){
                        runBalances(response).then(function(response){
                            $scope.transactions = response;
                            defer.resolve();
                        });
                    });
                });

                return defer.promise;
            }

            // Adding Transactions

            this.add = function(transaction) {
                return updateTransactions('POST', 'transactions/', transaction);
            };

            // Editing Transactions

            var editing = false;
            this.edit = function(transaction) {
                var defer = $q.defer();

                editing = true;
                updateTransactions('PUT', 'transactions/' + transaction.id, transaction).then(function() {
                    editing = false;
                    defer.resolve();
                });

                return defer.promise;
            };

            this.isEditing = function() {
                return editing === true;
            };

            // Deleting Transactions

            var checkedIds = [];
            $scope.checked = function(transaction) {
                if(checkedIds.indexOf(transaction.id) !== -1) {
                    checkedIds.splice(checkedIds.indexOf(transaction.id), 1);
                } else {
                    checkedIds.push(transaction.id);
                }
            };

            this.hasCheckedIds = function() {
                return checkedIds.length > 0;
            };

            this.delete = function() {
                var defer = $q.defer();
                var promises  = [];

                angular.forEach(checkedIds,function(id){
                    promises.push(updateTransactions('DELETE', 'transactions/' + id));
                });

                $q.all(promises).then(function() {
                    checkedIds = [];
                    defer.resolve();
                });

                return defer.promise;
            };

            // Search / Filtering Transactions
            var newTransactions = [];
            this.search = function(filterProperties) {

                var defer = $q.defer();

                transactionsService.service('GET', 'transactions?_sort=date&_order=DESC').then(function(response){
                    runBalances(response).then(function(response){
                        defer.resolve(newTransactions = $filter('filterSearchTransaction')(response, filterProperties));
                    });
                });

                return defer.promise;
            };

            this.hideTable = function() {
                var defer = $q.defer();

                $scope.transactions = [];
                $scope.$apply();
                defer.resolve();

                return defer.promise;
            };

            this.showTable = function() {
                $scope.transactions = newTransactions;
                $scope.$apply();
            }
        },
        link: function(scope, element, attrs, ctrl) {
            var deleteElement = $(element).find('.transaction-delete');
            var syncElement = $(element).find('.transaction-sync');
            syncElement.hide();

            scope.delete = function() {
                if(ctrl.hasCheckedIds()) {
                    deleteElement.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            ctrl.delete().then(function() {
                                syncElement.fadeOut().promise().done(function(){
                                    deleteElement.fadeIn();
                                });
                            });
                        });
                    });
                }
            }
        }
    }
});