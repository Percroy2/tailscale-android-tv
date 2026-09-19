package fr.percroy.tailcontrol.presentation.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.compose.foundation.lazy.LazyColumn
import androidx.tv.material3.Button
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import fr.percroy.tailcontrol.data.ServiceLocator
import fr.percroy.tailcontrol.domain.model.PermissionFlags
import fr.percroy.tailcontrol.presentation.activity.ActivityScreen
import fr.percroy.tailcontrol.presentation.activity.ActivityViewModel
import fr.percroy.tailcontrol.presentation.admin.AdminPinViewModel
import fr.percroy.tailcontrol.presentation.audit.AuditScreen
import fr.percroy.tailcontrol.presentation.audit.AuditViewModel
import fr.percroy.tailcontrol.presentation.compliance.NavPermissions
import fr.percroy.tailcontrol.presentation.admin.AuthKeysScreen
import fr.percroy.tailcontrol.presentation.admin.AuthKeysViewModel
import fr.percroy.tailcontrol.presentation.admin.DnsScreen
import fr.percroy.tailcontrol.presentation.admin.DnsViewModel
import fr.percroy.tailcontrol.presentation.admin.PolicyScreen
import fr.percroy.tailcontrol.presentation.admin.PolicyViewModel
import fr.percroy.tailcontrol.presentation.alerts.AlertsScreen
import fr.percroy.tailcontrol.presentation.alerts.AlertsViewModel
import fr.percroy.tailcontrol.presentation.dashboard.DashboardScreen
import fr.percroy.tailcontrol.presentation.dashboard.DashboardViewModel
import fr.percroy.tailcontrol.presentation.devices.DeviceDetailScreen
import fr.percroy.tailcontrol.presentation.devices.DeviceDetailViewModel
import fr.percroy.tailcontrol.presentation.devices.DevicesScreen
import fr.percroy.tailcontrol.presentation.devices.DevicesViewModel
import fr.percroy.tailcontrol.presentation.favorites.FavoritesScreen
import fr.percroy.tailcontrol.presentation.favorites.FavoritesViewModel
import fr.percroy.tailcontrol.presentation.monitoring.MonitoringScreen
import fr.percroy.tailcontrol.presentation.monitoring.MonitoringViewModel
import fr.percroy.tailcontrol.presentation.network.ExitNodesScreen
import fr.percroy.tailcontrol.presentation.network.ExitNodesViewModel
import fr.percroy.tailcontrol.presentation.network.RoutesScreen
import fr.percroy.tailcontrol.presentation.network.RoutesViewModel
import fr.percroy.tailcontrol.presentation.network.UsersScreen
import fr.percroy.tailcontrol.presentation.network.UsersViewModel
import fr.percroy.tailcontrol.presentation.settings.SettingsScreen
import fr.percroy.tailcontrol.presentation.settings.SettingsViewModel
import androidx.compose.runtime.LaunchedEffect

private object NavRoutes {
    const val Dashboard = "dashboard"
    const val Machines = "machines"
    const val MachineDetail = "machines/{deviceId}"
    const val Routes = "routes"
    const val ExitNodes = "exit-nodes"
    const val Users = "users"
    const val Alerts = "alerts"
    const val Dns = "dns"
    const val AuthKeys = "auth-keys"
    const val Policy = "policy"
    const val Monitoring = "monitoring"
    const val Activity = "activity"
    const val Audit = "audit"
    const val Settings = "settings"
    const val Favorites = "favorites"

    fun machineDetail(deviceId: String) = "machines/$deviceId"
}

private data class NavItem(val route: String, val label: String)

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TailControlNavHost(
    services: ServiceLocator,
    onLoggedOut: () -> Unit,
) {
    val navController = rememberNavController()
    val backStack = navController.currentBackStackEntryAsState()
    val currentRoute = backStack.value?.destination?.route

    val adminPinViewModel = remember { AdminPinViewModel(services.adminPinRepository) }
    val dashboardViewModel = remember { DashboardViewModel(services.dashboardRepository) }
    val devicesViewModel = remember { DevicesViewModel(services.deviceRepository) }
    val routesViewModel = remember {
        RoutesViewModel(services.networkRepository, services.deviceRepository)
    }
    val exitNodesViewModel = remember { ExitNodesViewModel(services.networkRepository) }
    val usersViewModel = remember { UsersViewModel(services.networkRepository) }
    val alertsViewModel = remember { AlertsViewModel(services.alertsRepository) }
    val dnsViewModel = remember { DnsViewModel(services.dnsRepository) }
    val authKeysViewModel = remember { AuthKeysViewModel(services.authKeysRepository) }
    val policyViewModel = remember { PolicyViewModel(services.policyRepository) }
    val settingsViewModel = remember {
        SettingsViewModel(services.tvSessionRepository, services.sessionRepository)
    }
    val favoritesViewModel = remember { FavoritesViewModel(services.favoritesRepository) }
    val monitoringViewModel = remember { MonitoringViewModel(services.monitoringRepository) }
    val auditViewModel = remember { AuditViewModel(services.auditRepository) }
    val activityViewModel = remember { ActivityViewModel(services.activityRepository) }

    val settingsState by settingsViewModel.state.collectAsState()
    val permissions = settingsState.profile?.permissions ?: PermissionFlags()

    LaunchedEffect(services.refreshNotifier) {
        services.refreshNotifier.events.collect {
            dashboardViewModel.refresh()
            devicesViewModel.refresh()
            routesViewModel.refresh()
            exitNodesViewModel.refresh()
            usersViewModel.refresh()
            alertsViewModel.refresh()
            dnsViewModel.refresh()
            authKeysViewModel.refresh()
            policyViewModel.refresh()
            favoritesViewModel.refresh()
            monitoringViewModel.refresh()
            auditViewModel.refresh()
            activityViewModel.refresh()
        }
    }

    LaunchedEffect(services.alertNotifier) {
        services.alertNotifier.events.collect { alert ->
            alertsViewModel.onLiveAlert(alert.title, alert.message)
        }
    }

    val navItems = buildList {
        add(NavItem(NavRoutes.Dashboard, "Dashboard"))
        add(NavItem(NavRoutes.Favorites, "Favoris"))
        add(NavItem(NavRoutes.Machines, "Machines"))
        if (NavPermissions.canShowRoutes(permissions)) {
            add(NavItem(NavRoutes.Routes, "Routes"))
            add(NavItem(NavRoutes.ExitNodes, "Exit Nodes"))
        }
        if (NavPermissions.canShowUsers(permissions)) {
            add(NavItem(NavRoutes.Users, "Utilisateurs"))
        }
        if (NavPermissions.canShowDns(permissions)) {
            add(NavItem(NavRoutes.Dns, "DNS"))
        }
        if (NavPermissions.canShowAuthKeys(permissions)) {
            add(NavItem(NavRoutes.AuthKeys, "Auth Keys"))
        }
        if (NavPermissions.canShowPolicy(permissions)) {
            add(NavItem(NavRoutes.Policy, "Politique"))
        }
        add(NavItem(NavRoutes.Monitoring, "Supervision"))
        add(NavItem(NavRoutes.Alerts, "Alertes"))
        add(NavItem(NavRoutes.Activity, "Activité"))
        add(NavItem(NavRoutes.Audit, "Audit"))
        add(NavItem(NavRoutes.Settings, "Paramètres"))
    }

    Row(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .width(240.dp)
                .fillMaxHeight()
                .padding(24.dp),
        ) {
            Text(text = "TAILCONTROL", style = MaterialTheme.typography.titleMedium)
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(navItems.size) { index ->
                    val item = navItems[index]
                    NavButton(
                        label = item.label,
                        selected = currentRoute == item.route ||
                            (item.route == NavRoutes.Machines && currentRoute?.startsWith("machines") == true),
                        onClick = { navController.navigate(item.route) },
                    )
                }
            }
        }

        NavHost(
            navController = navController,
            startDestination = NavRoutes.Dashboard,
            modifier = Modifier.weight(1f),
        ) {
            composable(NavRoutes.Dashboard) {
                DashboardScreen(viewModel = dashboardViewModel)
            }
            composable(NavRoutes.Favorites) {
                FavoritesScreen(viewModel = favoritesViewModel)
            }
            composable(NavRoutes.Machines) {
                DevicesScreen(
                    viewModel = devicesViewModel,
                    onDeviceClick = { deviceId ->
                        navController.navigate(NavRoutes.machineDetail(deviceId))
                    },
                )
            }
            composable(
                route = NavRoutes.MachineDetail,
                arguments = listOf(navArgument("deviceId") { type = NavType.StringType }),
            ) { entry ->
                val deviceId = entry.arguments?.getString("deviceId") ?: return@composable
                val detailViewModel = remember(deviceId) {
                    DeviceDetailViewModel(
                        services.deviceRepository,
                        services.favoritesRepository,
                        deviceId,
                    )
                }
                DeviceDetailScreen(
                    viewModel = detailViewModel,
                    adminPinViewModel = adminPinViewModel,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(NavRoutes.Routes) {
                RoutesScreen(viewModel = routesViewModel)
            }
            composable(NavRoutes.ExitNodes) {
                ExitNodesScreen(viewModel = exitNodesViewModel)
            }
            composable(NavRoutes.Users) {
                UsersScreen(
                    viewModel = usersViewModel,
                    adminPinViewModel = adminPinViewModel,
                )
            }
            composable(NavRoutes.Dns) {
                DnsScreen(viewModel = dnsViewModel)
            }
            composable(NavRoutes.AuthKeys) {
                AuthKeysScreen(
                    viewModel = authKeysViewModel,
                    adminPinViewModel = adminPinViewModel,
                )
            }
            composable(NavRoutes.Policy) {
                PolicyScreen(viewModel = policyViewModel)
            }
            composable(NavRoutes.Monitoring) {
                MonitoringScreen(viewModel = monitoringViewModel)
            }
            composable(NavRoutes.Alerts) {
                AlertsScreen(viewModel = alertsViewModel)
            }
            composable(NavRoutes.Activity) {
                ActivityScreen(viewModel = activityViewModel)
            }
            composable(NavRoutes.Audit) {
                AuditScreen(viewModel = auditViewModel)
            }
            composable(NavRoutes.Settings) {
                SettingsScreen(
                    viewModel = settingsViewModel,
                    adminPinViewModel = adminPinViewModel,
                    onLoggedOut = onLoggedOut,
                )
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun NavButton(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Button(onClick = onClick, modifier = Modifier.padding(vertical = 4.dp)) {
        Text(
            text = label,
            color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface,
        )
    }
}
