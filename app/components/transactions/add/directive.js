app.directive('transactionsAdd', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/add/view.html',
        controller: function($scope, $q) {
            var date = new Date();
            $scope.transaction = {
                date: date,
                description: "",
                accountId: 0,
                categoryId: 0,
                statusId: 0,
                parentId: 0,
                amount: null
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

            this.isValid = function() {
                return ($scope.transaction.description !== '') && ($scope.transaction.amount !== 0);
            };

            $scope.isUpdating = false;
            this.updateData = function() {
                transactionsService.service('POST', 'transactions/', $scope.transaction).then(function() {
                    $scope.isUpdating = true;
                    transactionsService.setUpdateStatus(1);
                });
            };

            this.updateDone = function() {
                $scope.isUpdating = false;
                transactionsService.setUpdateStatus(0);

                var date = new Date();
                $scope.transaction = {
                    date: date,
                    description: "",
                    accountId: 0,
                    categoryId: 0,
                    statusId: 0,
                    parentId: 0,
                    amount: null
                };
                $scope.$apply();
            }
        },
        link: function(scope, element, attrs, ctrl) {
            var form = $(element).find('.transaction-form');
            var syncElement = $(element).find('.transaction-sync');
            var button = $(element).find('.transaction-submit');

            syncElement.hide();

            scope.add = function (event) {
                event.preventDefault(); // prevents page refresh

                if(ctrl.isValid()) {
                    button.fadeOut().promise().done(function () {
                        syncElement.fadeIn().promise().done(function () {
                            ctrl.updateData();
                        });
                    });
                }
            };

            scope.$on('transactions:updated', function(event, data) {
                if(transactionsService.getUpdateStatus() === 2 && scope.isUpdating) {
                    syncElement.fadeOut().promise().then(function() {
                        button.fadeIn().promise().then(function() {
                            ctrl.updateDone();
                        });
                    });
                }
            });

        }
    }
}]);