import { createRouter, createWebHistory } from 'vue-router'
import HostView from '../views/HostView.vue'
import PlayerView from '../views/PlayerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/host',
      name: 'host',
      component: HostView,
    },
    {
      path: '/player',
      name: 'player',
      component: PlayerView,
      props: { team: 'A' }
    },
    {
      path: '/player1',
      name: 'player1',
      component: PlayerView,
      props: { team: 'A' }
    },
    {
      path: '/player2',
      name: 'player2',
      component: PlayerView,
      props: { team: 'B' }
    },
    {
      path: '/',
      redirect: '/host'
    }
  ],
})

export default router
