/// lib/features/auth/auth_controller.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/token_storage.dart';
import 'auth_models.dart';
import 'auth_repository.dart';

class AuthState {
  final bool loading;
  final UserMe? user;
  const AuthState({this.loading = false, this.user});
  bool get isLoggedIn => user != null;
  AuthState copyWith({bool? loading, UserMe? user}) =>
      AuthState(loading: loading ?? this.loading, user: user ?? this.user);
}

final authRepositoryProvider = FutureProvider<AuthRepository>((ref) async => AuthRepository.create());

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref);
});

class AuthController extends StateNotifier<AuthState> {
  final Ref _ref;
  final StreamController<AuthState> _stream = StreamController.broadcast();
  AuthController(this._ref) : super(const AuthState()) {
    _init();
  }
  Stream<AuthState> get stream => _stream.stream;

  Future<void> _init() async {
    final token = await TokenStorage.readToken();
    if (token != null && token.isNotEmpty) await refreshMe();
  }

  Future<AuthRepository> _repo() async => await _ref.read(authRepositoryProvider.future);

  Future<void> login(String email, String password) async {
    state = state.copyWith(loading: true);
    final r = await _repo();
    await r.login(email, password);
    await refreshMe();
  }

  Future<void> register(String email, String password, {String? name}) async {
    state = state.copyWith(loading: true);
    final r = await _repo();
    await r.register(email, password, name: name);
    await refreshMe();
  }

  Future<void> loginWithGoogle() async {
    state = state.copyWith(loading: true);
    final r = await _repo();
    await r.loginWithGoogle();
    await refreshMe();
  }

  Future<void> refreshMe() async {
    final r = await _repo();
    final me = await r.me();
    state = state.copyWith(loading: false, user: me);
    _stream.add(state);
  }

  Future<void> logout() async {
    final r = await _repo();
    await r.logout();
    state = const AuthState();
    _stream.add(state);
  }

  @override
  void dispose() {
    _stream.close();
    super.dispose();
  }
}
